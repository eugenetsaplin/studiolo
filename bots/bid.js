// A bid in an auction, judged by sampling: worlds of the hidden hands as dealt (consistent with the seat's view), the
// public bids replayed in the core, then every legal bid and the pass played to the end of the hand by the rollout
// (the exchange, the calls and the later bids of every seat by the policies of policy.js). The action with the best
// mean world score wins; a bid has to beat the pass by the level's bid_margin. See docs/BOT.md.
import { newHand } from '../core/index.js';
import { withOutCarry } from './carry.js';
import { bidAction } from './policy.js';
import { prepare, place } from './worlds.js';
import { rollout, scoreOf } from './rollout.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const round3 = (x) => Math.round(x * 1000) / 1000;
const PASS_MONTE = { type: 'a_monte_pass' };

// does this view ask for a bid (a legal bid and the pass, in the bidding phase, before any card is played)?
export function isBidView(view) {
	const legal = view.legal;
	return !!view.bidding && legal.some((a) => a.type.startsWith('bid_')) && legal.some((a) => a.type === 'pass') && !view.tricks.length && !view.trick.cards.length;
}

// Rebuilds a sampled deal as a Hand at the seat's bid: a_monte passes, the discards, then the public bids. null when the
// rebuilt view differs from the real one.
function rebuildBid(game, view, info, p, seed, rng) {
	const { n, me } = info;
	const hands = {};
	for (let q = 0; q < n; q++) hands[q] = q === me ? [...view.hand, ...view.discard.mine] : [...p.hands[q], ...p.discards[q]];
	const carry = withOutCarry(game, view, info.carryMatters ? { lastTaker: rng.int(n) } : null);
	let h;
	try {
		h = newHand(game, { seed, dealer: view.dealer, preset: { hands, rest: [...p.stockOrder, ...p.tail] }, carry });
		const left = {};
		for (let q = 0; q < n; q++) left[q] = q === me ? view.discard.mine.slice() : p.discards[q].slice();
		const bids = view.bidding.bids.slice();
		for (let guard = 0; guard < 400 && !h.isOver(); guard++) {
			const m = h.cur.module;
			const seat = h.toAct()[0];
			if (m === 'bidding' && !bids.length) break;
			let a = null;
			if (m === 'a_monte') a = PASS_MONTE;
			else if (m === 'discard') {
				const want = left[seat] && left[seat].shift();
				if (want === undefined) return null;
				a = { type: 'discard', card: want };
			} else if (m === 'bidding') {
				const b = bids.shift();
				if (b.seat !== seat) return null;
				a = { type: b.bid === 'pass' ? 'pass' : 'bid_' + b.bid };
			} else return null;
			if (!h.apply(seat, a).ok) return null;
		}
		if (bids.length || Object.values(left).some((l) => l.length)) return null;
	} catch {
		return null;
	}
	if (h.isOver() || h.cur.module !== 'bidding' || !h.toAct().includes(me)) return null;
	const v = h.view(me);
	for (const k of ['hand', 'legal', 'discard', 'bidding']) if (!same(v[k], view[k])) return null;
	return h;
}

function sampleBid(game, view, info, level, makeRng, seed, i) {
	for (let attempt = 0; attempt < 8; attempt++) {
		const rng = makeRng(`${seed}:w${i}:${attempt}`);
		const p = place(info, level, rng, attempt);
		if (!p) continue;
		const hand = rebuildBid(game, view, info, p, `${seed}:h${i}`, rng);
		if (hand) return hand;
	}
	return null;
}

// halving after 3, 6, 12, 24, ... worlds (as for a card)
function isHalvingStep(done) {
	let t = done;
	while (t > 3 && t % 2 === 0) t /= 2;
	return t === 3;
}

// The bid of a seat: {action, eval, stats}. The pass is never dropped by the halving: every bid is measured against it.
export function decideBid({ game, view, level, seed, ctx, makeRng }) {
	// the judge offers a bid equal to the standing one only to a seat that may match it (an earlier seat in the order of speech;
	// two seats cannot pass one bid to each other for ever): every bid of the legal list is judged, the equal one with the rest
	const standing = view.bidding.best ? ctx.contracts.find((x) => x.id === view.bidding.best.contract) : null;
	const higher = (a) => {
		if (a.type === 'pass') return true;
		const c = ctx.contracts.find((x) => 'bid_' + x.id === a.type);
		return !!c && (!standing || c.rank >= standing.rank);
	};
	const legal = view.legal.filter(higher);
	const stats = { worlds: 0, plays: 0, candidates: legal.length };
	if (legal.length === 1) return { action: legal[0], eval: [{ action: legal[0], value: 0 }], stats };
	const margin = level.bid_margin === undefined ? 0 : level.bid_margin;
	const info = prepare(game, view);
	const cands = legal.map((a, i) => ({ a, i, sum: 0, n: 0, alive: true, order: 0, pass: a.type === 'pass' }));
	const counter = { plays: 0 };
	let alive = cands.length;
	let missed = 0;
	if (info.ok && !info.ext && !info.contract) {
		for (let w = 0; w < level.worlds + missed; w++) {
			const world = sampleBid(game, view, info, level, makeRng, seed, w);
			if (!world) {
				if (++missed > level.worlds) break;
				continue;
			}
			stats.worlds++;
			for (const c of cands) {
				if (!c.alive) continue;
				const h = world.clone();
				if (!h.apply(view.seat, c.a).ok) { c.alive = false; alive--; continue; }
				counter.plays++;
				const res = rollout(h, ctx, level.rollout, makeRng(`${seed}:r${w}:${c.i}`), counter);
				c.sum += scoreOf(res, ctx, view.seat, level, h);
				c.n++;
			}
			const done = stats.worlds;
			if (level.halving && alive > 2 && isHalvingStep(done)) {
				const live = cands.filter((c) => c.alive && c.n > 0 && !c.pass).sort((x, y) => y.sum / y.n - x.sum / x.n || x.i - y.i);
				const keep = Math.max(1, Math.ceil(live.length / 2));
				live.slice(keep).forEach((c) => { c.alive = false; c.order = done; alive--; });
			}
			if (counter.plays >= level.budget_plays && stats.worlds >= 2) break;
		}
	}
	stats.plays = counter.plays;
	const mean = (c) => c.sum / c.n;
	const pass = cands.find((c) => c.pass);
	const finals = cands.filter((c) => c.alive && c.n > 0);
	if (!finals.length || !pass.n) {
		// no world could be built: the cheap policy on the cards held
		const a = bidAction(ctx, view.hand, view.legal, view.bidding);
		return { action: a, eval: [{ action: a, value: 0 }], stats };
	}
	finals.sort((x, y) => mean(y) - mean(x) || x.i - y.i);
	let best = finals[0];
	if (!best.pass && mean(best) - mean(pass) < margin) best = pass;
	const rest = cands.filter((c) => !c.alive && c.n > 0).sort((x, y) => y.order - x.order || mean(y) - mean(x) || x.i - y.i);
	const out = [...finals, ...rest].slice(0, 8).map((c) => ({ action: c.a, value: round3(mean(c)) }));
	return { action: best.a, eval: out, stats };
}
