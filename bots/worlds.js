// Worlds: complete deals consistent with what ONE seat knows, rebuilt as core Hands that can be played on.
// Input is the seat's view and nothing else. See docs/BOT.md.
import { ALL, FOOL } from '../core/cards.js';
import { newHand } from '../core/index.js';
import { withOutCarry } from './carry.js';
import { compileSelector } from '../core/selectors.js';
import { catOf } from './policy.js';
import { prepareExt, sampleExt } from './worlds_ext.js';
import { hasContracts, prepareContract, sampleContract } from './worlds_contract.js';

const entry = (game, m) => game.plan.find((e) => e.module === m) || null;

// Cards a discard phase would not like to put away (a hint for sampling only; the rebuild checks the real rule).
function barHint(game) {
	const e = entry(game, 'discard');
	if (!e) return () => false;
	const parts = [];
	if (e.set.discard_honours_barred !== false) {
		const sets = game.cfg.cards.sets;
		if (sets && sets.honours) parts.push(compileSelector('set:honours', game.env));
		else parts.push((c) => game.tables.values.v[c] >= 5);
	}
	for (const b of e.set.barred || []) parts.push(compileSelector(b, game.env));
	return (c) => parts.some((p) => p(c, null));
}

// Everything that depends on the view only. Returns {ok: false, why} when the view cannot be explained.
export function prepare(game, view) {
	if (view.open_piles || view.round) return prepareExt(game, view);
	const n = view.seats;
	const me = view.seat;
	const tr = entry(game, 'tricks');
	const followSuit = !tr || tr.set.follow_suit !== false;
	const mustTrump = !tr || tr.set.must_trump !== false;
	const foolTrump = game.cfg.cards.fool === 'trump';
	const played = Array.from({ length: n }, () => []);
	const plays = [];
	const voids = new Map();
	const addVoid = (seat, cat) => voids.set(seat + '|' + cat, { seat, cat });
	const scan = (cards) => {
		let led = null;
		for (const { seat, card } of cards) {
			played[seat].push(card);
			plays.push({ seat, card });
			if (card === FOOL && !foolTrump) continue;
			const c = catOf(card);
			if (led === null) { led = c; continue; }
			if (followSuit && c !== led) {
				addVoid(seat, led);
				if (mustTrump && c !== 'trump') addVoid(seat, 'trump');
			}
		}
	};
	for (const t of view.tricks) scan(t.cards);
	scan(view.trick.cards);

	const shared = view.partnerHands || {};
	const known = new Set([...view.hand, ...view.discard.mine, ...plays.map((p) => p.card), ...view.stock.drawn.map((d) => d.card)]);
	for (const q of Object.keys(shared)) for (const c of shared[q]) known.add(c);
	const pool = ALL.filter((c) => !known.has(c));

	const handNeed = {};
	const discNeed = {};
	let need = view.stock.count + view.rest.count;
	for (let q = 0; q < n; q++) {
		if (q === me) continue;
		handNeed[q] = q in shared ? 0 : view.handCounts[q];
		discNeed[q] = view.discard.counts[q];
		need += handNeed[q] + discNeed[q];
	}
	// stock cards drawn after tricks: some are shown to this seat, the others are hidden
	let drawn = -n * view.tricks.length;
	for (let q = 0; q < n; q++) drawn += view.won[q];
	const hiddenDrawn = drawn - view.stock.drawn.length;
	need += hiddenDrawn;
	if (hiddenDrawn < 0 || need !== pool.length) return { ok: false, why: 'the view does not add up' };

	// which tricks drew a card: the shown ones, then the earliest others (a trick with the Fool may draw nothing)
	const hook = (game.hooks.tricks || []).find((e) => e.module === 'prize_stock');
	const shown = new Map(view.stock.drawn.map((d) => [d.trick, d.card]));
	const order = [];
	let hidden = hiddenDrawn;
	view.tricks.forEach((t, i) => {
		if (shown.has(i)) order.push(shown.get(i));
		else if (hidden > 0 && !(t.fool !== null && hook && hook.set.fool_trick === 'nobody')) { order.push(null); hidden--; }
	});
	if (hidden > 0) return { ok: false, why: 'the drawn stock cards do not fit the tricks' };

	// the first leader of a hand: known once the play starts (a hidden carry before)
	const lead = view.tricks.length ? view.tricks[0].leader : view.trick.leader;
	const out = {
		ok: true, me, n, pool, sinkSize: view.stock.count + view.rest.count + hiddenDrawn, played, plays, voids: [...voids.values()], handNeed, discNeed, order, shared,
		hint: barHint(game), lead, carryMatters: view.match !== null && view.match.handIndex > 0,
	};
	// contracts, exchange, called partner or declarations: the play starts from hands set after the exchange
	return view.phase && view.phase.module === 'tricks' && hasContracts(game) ? prepareContract(game, view, out) : out;
}

function takeRandom(pool, k, rng, allowed) {
	const idx = [];
	for (let i = 0; i < pool.length; i++) if (!allowed || allowed(pool[i])) idx.push(i);
	if (idx.length < k) return null;
	const got = [];
	for (let j = 0; j < k; j++) {
		const r = j + rng.int(idx.length - j);
		[idx[j], idx[r]] = [idx[r], idx[j]];
		got.push(idx[j]);
	}
	const gone = new Set(got);
	return { cards: got.map((i) => pool[i]), left: pool.filter((_, i) => !gone.has(i)) };
}

function shuffled(arr, rng) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = rng.int(i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// One sampled deal (the hidden cards placed), or null when the voids cannot be met. The unknown cards are put into
// slots (the hand of each other seat, its discard, and one sink for the stock and the rest) one card at a time, the
// most constrained cards first, each into a slot chosen by its free room. A card the rules would not let a seat put
// away is only unlikely in that seat's discard (the rebuild has the last word).
export function place(info, level, rng, attempt) {
	const { n, me } = info;
	const dead = new Map();
	for (const v of info.voids) {
		// a forgotten void only costs worlds: the rebuild refuses a deal that breaks it. Later tries keep every void.
		if (attempt < 4 && level.forget > 0 && rng.next() < level.forget) continue;
		if (!dead.has(v.seat)) dead.set(v.seat, new Set());
		dead.get(v.seat).add(v.cat);
	}
	const slots = [];
	for (let q = 0; q < n; q++) {
		if (q === me) continue;
		if (info.handNeed[q]) slots.push({ kind: 'hand', seat: q, cap: info.handNeed[q], cards: [] });
		if (info.discNeed[q]) slots.push({ kind: 'disc', seat: q, cap: info.discNeed[q], cards: [] });
	}
	const sink = { kind: 'sink', seat: -1, cap: info.sinkSize, cards: [] };
	slots.push(sink);
	const weight = (slot, c) => {
		if (slot.kind === 'hand') { const v = dead.get(slot.seat); return v && v.has(catOf(c)) ? 0 : slot.cap; }
		if (slot.kind === 'disc') return info.hint(c) ? slot.cap * 0.05 : slot.cap;
		return slot.cap;
	};
	const cards = shuffled(info.pool.slice(), rng);
	const room = (c) => slots.reduce((k, s) => k + (weight(s, c) > 0 ? 1 : 0), 0);
	const ranked = cards.map((c) => [room(c), c]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
	for (const c of ranked) {
		let total = 0;
		const w = slots.map((s) => { const x = s.cap > 0 ? weight(s, c) : 0; total += x; return x; });
		if (total <= 0) return null;
		let r = rng.next() * total;
		let k = 0;
		while (k < slots.length - 1 && (w[k] <= 0 || r >= w[k])) { r -= w[k]; k++; }
		if (w[k] <= 0) k = w.findIndex((x) => x > 0);
		slots[k].cap--;
		slots[k].cards.push(c);
	}
	const hands = {};
	const discards = {};
	for (const s of slots) {
		if (s.kind === 'hand') hands[s.seat] = s.cards;
		else if (s.kind === 'disc') discards[s.seat] = s.cards;
	}
	for (let q = 0; q < n; q++) { if (q !== me) { hands[q] = hands[q] || []; discards[q] = discards[q] || []; } }
	shuffled(sink.cards, rng);
	let at = 0;
	const stockOrder = info.order.map((c) => (c === null ? sink.cards[at++] : c));
	return { hands, discards, stockOrder, tail: sink.cards.slice(at) };
}

const PASS = { type: 'a_monte_pass' };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Rebuilds the deal as a Hand at the seat's decision. null when it does not match the view.
function rebuild(game, view, info, p, seed, rng) {
	const { n, me } = info;
	const hands = {};
	for (let q = 0; q < n; q++) {
		if (q === me) hands[q] = [...view.hand, ...info.played[q], ...view.discard.mine];
		else hands[q] = [...(q in info.shared ? info.shared[q] : p.hands[q]), ...info.played[q], ...p.discards[q]];
	}
	let carry = null;
	if (info.lead !== null && info.lead !== undefined) carry = { lastTaker: info.lead };
	else if (info.carryMatters) carry = { lastTaker: rng.int(n) };
	carry = withOutCarry(game, view, carry);
	let h;
	try {
		h = newHand(game, { seed, dealer: view.dealer, preset: { hands, rest: [...p.stockOrder, ...p.tail] }, carry });
		let guard = 0;
		while (!h.isOver() && h.cur.module === 'a_monte' && guard++ < 100) {
			if (!h.apply(h.toAct()[0], PASS).ok) return null;
		}
		if (!h.isOver() && h.cur.module === 'discard') {
			const left = {};
			for (let q = 0; q < n; q++) left[q] = q === me ? view.discard.mine.slice() : p.discards[q].slice();
			while (!h.isOver() && h.cur.module === 'discard') {
				const q = h.toAct()[0];
				if (!left[q].length) break;
				if (!h.apply(q, { type: 'discard', card: left[q].shift() }).ok) return null;
			}
			if (Object.values(left).some((l) => l.length)) return null;
		}
		for (const { seat, card } of info.plays) if (!h.apply(seat, { type: 'play', card }).ok) return null;
	} catch {
		return null;
	}
	if (h.isOver() || !h.toAct().includes(me)) return null;
	const v = h.view(me);
	if (!same(v.hand, view.hand) || !same(v.legal, view.legal) || !same(v.tricks, view.tricks) || !same(v.trick, view.trick) || !same(v.discard, view.discard)) return null;
	return h;
}

// World number i: tries a few samples; returns {hand, attempts} or null.
export function sampleWorld(game, view, info, level, makeRng, seed, i) {
	if (info.ext) return sampleExt(game, view, info, level, makeRng, seed, i);
	if (info.contract) return sampleContract(game, view, info, level, makeRng, seed, i, place);
	for (let attempt = 0; attempt < 8; attempt++) {
		const rng = makeRng(`${seed}:w${i}:${attempt}`);
		const p = place(info, level, rng, attempt);
		if (!p) continue;
		const hand = rebuild(game, view, info, p, `${seed}:h${i}`, rng);
		if (hand) return { hand, attempts: attempt + 1 };
	}
	return null;
}
