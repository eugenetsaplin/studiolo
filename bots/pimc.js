// Perfect-Information Monte Carlo: sample worlds consistent with the view, play every legal action to the end of the
// hand in each world, keep the action with the best mean world score. The same worlds judge every action.
import { makeRng } from '../core/index.js';
import { ctxOf, greedyPlay, greedyDiscard, foolGive, monte, claimAction, showAction, contractAction, isContractLegal } from './policy.js';
import { prepare, sampleWorld } from './worlds.js';
import { rollout, scoreOf, marginOf, SLIP } from './rollout.js';
import { isBidView, decideBid } from './bid.js';

const EPS = 1e-9;
const round3 = (x) => Math.round(x * 1000) / 1000;

// The cheap answer used by the "greedy" fallback and when a world cannot be built.
export function cheapAction(ctx, view) {
	const legal = view.legal.filter((a) => a.type !== 'claim_fuora' && a.type !== 'show_fool');
	if (!legal.length) return view.legal[0];
	const t = legal[0].type;
	if (isContractLegal(legal)) return contractAction(ctx, view.hand, legal, view.bidding);
	if (t === 'play') return greedyPlay(ctx, legal, view.trick.cards, view.seat, sidesOf(view, ctx));
	if (t === 'discard') return greedyDiscard(ctx, legal, view.hand);
	if (t === 'fool_give') return foolGive(ctx, legal);
	return monte(ctx, view);
}

// the sides as this seat knows them (a secret partner is null: treated as the other side)
function sidesOf(view, ctx) {
	const of = view.sides && view.sides.of;
	return of ? ctx.sideOf.map((_, q) => (of[q] === null || of[q] === undefined ? -1 - q : of[q])) : ctx.sideOf;
}

// halving after 3, 6, 12, 24, ... worlds
function isHalvingStep(done) {
	let t = done;
	while (t > 3 && t % 2 === 0) t /= 2;
	return t === 3;
}

function tieKey(ctx, a) {
	return a.card ? ctx.val[a.card] : 0;
}

export function decide({ game, view, level, seed }) {
	const ctx = ctxOf(game);
	let legal = view.legal;
	// the non-card actions are policies (no sampling): claim exactly when out, show the Fool at once
	const policy = claimAction(ctx, view) || showAction(view);
	if (policy) return { action: policy, eval: [{ action: policy, value: 0 }], stats: { worlds: 0, plays: 0, candidates: legal.length } };
	// a bid of an auction: judged by sampling the hidden hands and playing every bid and the pass to the end (bid.js)
	if (isBidView(view)) return decideBid({ game, view, level, seed, ctx, makeRng });
	// the exchange, the call, declarations: policies on the cards held, no sampling
	if (isContractLegal(legal)) {
		const a = legal.length === 1 ? legal[0] : contractAction(ctx, view.hand, legal, view.bidding) || legal[0];
		return { action: a, eval: [{ action: a, value: 0 }], stats: { worlds: 0, plays: 0, candidates: legal.length } };
	}
	if (legal.some((a) => a.type === 'claim_fuora') && legal.some((a) => a.type !== 'claim_fuora')) legal = legal.filter((a) => a.type !== 'claim_fuora');
	const stats = { worlds: 0, plays: 0, candidates: legal.length };
	if (legal.length === 0) return { action: null, eval: [], stats };
	if (legal.length === 1) return { action: legal[0], eval: [{ action: legal[0], value: 0 }], stats };
	const type = legal[0].type;
	if (type !== 'play' && type !== 'discard') {
		const a = type === 'fool_give' ? foolGive(ctx, legal) : monte(ctx, { ...view, legal });
		return { action: a, eval: [{ action: a, value: 0 }], stats };
	}
	const noise = makeRng(seed + ':noise');
	if (level.noise > 0 && noise.next() < level.noise) {
		const a = legal[noise.int(legal.length)];
		return { action: a, eval: [{ action: a, value: 0 }], stats };
	}
	const info = prepare(game, view);
	const cands = legal.map((a, i) => ({ a, i, sum: 0, pts: 0, n: 0, alive: true, order: 0 }));
	const counter = { plays: 0 };
	let alive = cands.length;
	let missed = 0;
	if (info.ok) {
		for (let w = 0; w < level.worlds + missed; w++) {
			const world = sampleWorld(game, view, info, level, makeRng, seed, w);
			if (!world) {
				if (++missed > level.worlds) break;
				continue;
			}
			stats.worlds++;
			for (const c of cands) {
				if (!c.alive) continue;
				const h = world.hand.clone();
				if (!h.apply(view.seat, c.a).ok) { c.alive = false; alive--; continue; }
				counter.plays++;
				const res = rollout(h, ctx, level.rollout, makeRng(`${seed}:r${w}:${c.i}`), counter, level.slip ?? SLIP);
				c.sum += scoreOf(res, ctx, view.seat, level, h);
					c.pts += marginOf(res, ctx, view.seat, h);
				c.n++;
			}
			const done = stats.worlds;
			if (level.halving && alive > 2 && isHalvingStep(done)) {
				const live = cands.filter((c) => c.alive && c.n > 0).sort((x, y) => y.sum / y.n - x.sum / x.n || x.i - y.i);
				const keep = Math.max(2, Math.ceil(live.length / 2));
				live.slice(keep).forEach((c) => { c.alive = false; c.order = done; alive--; });
			}
			if (alive <= 1) break;
			if (counter.plays >= level.budget_plays && stats.worlds >= 2) break;
		}
	}
	stats.plays = counter.plays;
	const scored = cands.filter((c) => c.n > 0);
	if (!scored.length) {
		const a = cheapAction(ctx, view);
		return { action: a, eval: [{ action: a, value: 0 }], stats };
	}
	// survivors first (they saw every world), then the dropped ones by the round they fell in
	const mean = (c) => c.sum / c.n;
	const finals = scored.filter((c) => c.alive);
	finals.sort((x, y) => (Math.abs(mean(y) - mean(x)) > EPS ? mean(y) - mean(x) : tieKey(ctx, x.a) - tieKey(ctx, y.a) || x.i - y.i));
	let best = finals[0];
	if (level.temperature > 0 && finals.length > 1) {
		// softmax over the mean book-point margin, not the search score (which carries win_weight)
		const pts = (c) => c.pts / c.n;
		const top = Math.max(...finals.map(pts));
		const w = finals.map((c) => Math.exp((pts(c) - top) / level.temperature));
		let r = makeRng(seed + ':temp').next() * w.reduce((s, x) => s + x, 0);
		for (let k = 0; k < finals.length; k++) { r -= w[k]; if (r <= 0) { best = finals[k]; break; } }
	}
	const rest = scored.filter((c) => !c.alive).sort((x, y) => y.order - x.order || mean(y) - mean(x) || x.i - y.i);
	const out = [...finals, ...rest].slice(0, 8).map((c) => ({ action: c.a, value: round3(mean(c)) }));
	return { action: best.a, eval: out, stats };
}
