// Worlds for the two structures of the third round of games: a repeat group (deals again and again from one stock,
// going out) and piles (covered pile cards; only the open tops are played). Input is the seat's view only.
// A world places the hidden cards; the public history (every trick of the whole hand, the shown cards) is replayed
// through the core and the rebuilt view must equal the real one. See docs/BOT.md.
import { ALL, FOOL } from '../core/cards.js';
import { newHand } from '../core/index.js';
import { roleValue, seatAt } from '../core/util.js';
import { catOf } from './policy.js';
import { place } from './worlds.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const dealEntry = (game) => game.plan.find((e) => e.module === 'deal');

function shuffled(arr, rng) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = rng.int(i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// The order the dealer gives the cards in (the same rule as the deal module: from the dealer's right).
function dealingOrder(game, dealer, n) {
	const step = dealEntry(game).set.order === 'from_left' ? -1 : 1;
	return Array.from({ length: n }, (_, i) => seatAt(dealer, (i + 1) * step, n));
}

// Void inference of ONE round: a seat that did not follow the led suit is void in it, and (must_trump) void in
// trumps when it played a plain card. With the Fool a trump (cards.fool "trump") it is an ordinary trump here.
function voidsOf(game, trickLists) {
	const tr = game.plan.find((e) => e.module === 'tricks');
	const followSuit = !tr || tr.set.follow_suit !== false;
	const mustTrump = !tr || tr.set.must_trump !== false;
	const foolTrump = game.cfg.cards.fool === 'trump';
	const out = new Map();
	const add = (seat, cat) => out.set(seat + '|' + cat, { seat, cat });
	for (const cards of trickLists) {
		let led = null;
		for (const { seat, card } of cards) {
			if (card === FOOL && !foolTrump) continue;
			const c = catOf(card);
			if (led === null) { led = c; continue; }
			if (followSuit && c !== led) {
				add(seat, led);
				if (mustTrump && c !== 'trump') add(seat, 'trump');
			}
		}
	}
	return [...out.values()];
}

// Everything that depends on the view only. {ok: false, why} when the view cannot be explained.
export function prepareExt(game, view) {
	const n = view.seats;
	const me = view.seat;
	const piles = view.open_piles || null;
	const tricks = view.tricks;
	let hs = 0;
	if (!piles) {
		const set = dealEntry(game).set;
		for (let q = 0; q < n; q++) hs = Math.max(hs, roleValue(set.hand_size, q, view.dealer));
		if (!(hs > 0)) return { ok: false, why: 'no hand size' };
	}
	const cur = view.round ? view.round.index : 0;
	if (!piles && cur !== Math.floor(tricks.length / hs)) return { ok: false, why: 'the round does not match the tricks' };
	const roundOf = (t) => (piles ? 0 : Math.floor(t / hs));
	const rounds = Array.from({ length: cur + 1 }, () => Array.from({ length: n }, () => []));
	const plays = [];
	const lists = [];
	const known = new Set(view.hand);
	tricks.forEach((t, i) => {
		for (const p of t.cards) { rounds[roundOf(i)][p.seat].push(p.card); plays.push(p); known.add(p.card); }
		if (roundOf(i) === cur) lists.push(t.cards);
	});
	for (const p of view.trick.cards) { rounds[cur][p.seat].push(p.card); plays.push(p); known.add(p.card); }
	if (view.trick.cards.length) lists.push(view.trick.cards);
	const info = { ok: true, ext: true, me, n, plays, rounds, cur, hs, piles: !!piles, voids: voidsOf(game, lists), lead: tricks.length ? tricks[0].leader : view.trick.leader };
	if (piles) return prepPiles(game, view, info, known);
	const pool = ALL.filter((c) => !known.has(c));
	const handNeed = {};
	let need = view.round ? view.round.stock : view.rest.count;
	for (let q = 0; q < n; q++) if (q !== me) { handNeed[q] = view.handCounts[q]; need += handNeed[q]; }
	if (need !== pool.length) return { ok: false, why: 'the view does not add up' };
	const discNeed = {};
	for (let q = 0; q < n; q++) discNeed[q] = 0;
	return { ...info, pool, handNeed, discNeed, sinkSize: view.round ? view.round.stock : view.rest.count, order: [], hint: () => false, shared: {} };
}

function prepPiles(game, view, info, known) {
	const { n } = info;
	const sizes = dealEntry(game).set.piles;
	if (!Array.isArray(sizes)) return { ok: false, why: 'no piles' };
	const shown = view.open_piles.shown || {};
	const consumed = [];
	let covered = 0;
	for (let q = 0; q < n; q++) {
		const mine = view.open_piles.piles[q];
		if (!mine || mine.length !== sizes.length) return { ok: false, why: 'bad piles' };
		mine.forEach((p, k) => {
			if (p.top) known.add(p.top);
			covered += p.size - (p.top ? 1 : 0);
			consumed.push({ seat: q, pile: k, left: sizes[k] - p.size });
		});
		for (const c of shown[q] || []) known.add(c);
	}
	const events = info.plays.length + Object.values(shown).reduce((s, l) => s + l.length, 0);
	const pool = ALL.filter((c) => !known.has(c));
	if (pool.length !== covered || consumed.some((c) => c.left < 0) || consumed.reduce((s, c) => s + c.left, 0) !== events) return { ok: false, why: 'the piles do not add up' };
	const { events: base, foolTrump } = pileEvents(game, view, info);
	return { ...info, sizes, pool, consumed, shown, cards: view.open_piles.piles, base, foolTrump };
}

// ---- repeat group (no piles): the hidden hands and the stock order ----

function sampleRepeat(info, level, rng, attempt) {
	return place(info, level, rng, attempt);
}

function rebuildRepeat(game, view, info, p, seed) {
	const { n, me, cur, rounds } = info;
	const order = dealingOrder(game, view.dealer, n);
	const rowOf = (r, q) => (r < cur ? rounds[r][q] : q === me ? [...view.hand, ...rounds[r][q]] : [...p.hands[q], ...rounds[r][q]]);
	const hands = {};
	for (let q = 0; q < n; q++) hands[q] = rowOf(0, q);
	const rest = [];
	for (let r = 1; r <= cur; r++) for (const q of order) rest.push(...rowOf(r, q));
	rest.push(...p.tail);
	return replay(game, view, info, seed, { hands, rest }, info.plays.map((x) => ({ seat: x.seat, action: { type: 'play', card: x.card } })));
}

// Applies the history to a new hand and checks the rebuilt view against the real one. null when it does not match.
function replay(game, view, info, seed, preset, steps) {
	let h;
	try {
		h = newHand(game, { seed, dealer: view.dealer, preset, carry: info.lead !== null && info.lead !== undefined ? { lastTaker: info.lead } : null });
		for (const st of steps) if (!h.apply(st.seat, st.action).ok) return null;
	} catch {
		return null;
	}
	if (h.isOver() || !h.toAct().includes(info.me)) return null;
	const v = h.view(info.me);
	// a claim already made by someone (false, or the window is over) is not replayed: compare without claim_fuora
	const noClaim = (l) => l.filter((a) => a.type !== 'claim_fuora');
	if (!same(v.hand, view.hand) || !same(noClaim(v.legal), noClaim(view.legal)) || !same(v.tricks, view.tricks) || !same(v.trick, view.trick)) return null;
	if (view.round && (!v.round || v.round.index !== view.round.index || v.round.stock !== view.round.stock)) return null;
	if (view.open_piles && !same(v.open_piles, view.open_piles)) return null;
	return h;
}

// ---- piles: the covered cards are free; what is chosen is which pile each played or shown card came from ----

// The plays in time order, each with its trick index and, when the seat did not follow, what it cannot have held.
function pileEvents(game, view, info) {
	const tr = game.plan.find((e) => e.module === 'tricks');
	const follow = !tr || tr.set.follow_suit !== false;
	const mustTrump = !tr || tr.set.must_trump !== false;
	const foolTrump = game.cfg.cards.fool === 'trump';
	const out = [];
	const lists = [...view.tricks.map((t) => t.cards), view.trick.cards];
	lists.forEach((cards, ti) => {
		let led = null;
		for (const { seat, card } of cards) {
			let nf = null;
			if (card !== FOOL || foolTrump) {
				const c = catOf(card);
				if (led === null) led = c;
				else if (follow && c !== led) nf = { led, plain: mustTrump && c !== 'trump' };
			}
			out.push({ seat, card, show: false, trick: ti, nf });
		}
	});
	return { events: out, foolTrump };
}

// x lay on top of a pile of `owner` and was open during these events (later than `from`, earlier than its own play):
// would it have been a card the owner, who did not follow, could not have held?
function exposedWrong(ev, owner, x, from, until, foolTrump) {
	if (!x || (x === FOOL && !foolTrump)) return false;
	const c = catOf(x);
	const list = ev.nfBy[owner];
	for (let k = 0; k < list.length; k++) {
		const i = list[k];
		if (i >= until) break;
		if (i < from) continue;
		const nf = ev[i].nf;
		if (c === nf.led || (nf.plain && c === 'trump')) return true;
	}
	return false;
}

// The covered cards are free. What is chosen is the pile each played or shown card came from. The plays are put
// back on the piles last first, so that each card put down knows the card under it (the one that turned up after
// it) and can be checked against the plays of the owner while it lay open.
function samplePiles(info, rng) {
	const { n, consumed, shown, base, foolTrump } = info;
	const ev = base.map((e) => ({ ...e }));
	for (const q of Object.keys(shown)) {
		for (const card of shown[q]) {
			const seat = Number(q);
			const turns = ev.reduce((k, e) => k + (e.seat === seat && !e.show ? 1 : 0), 0);
			let k = rng.int(turns + 1);
			let at = ev.length;
			for (let i = 0; i < ev.length; i++) if (ev[i].seat === seat && !ev[i].show && k-- === 0) { at = i; break; }
			ev.splice(at, 0, { seat, card, show: true, trick: at < ev.length ? ev[at].trick : ev.length ? ev[ev.length - 1].trick : 0, nf: null });
		}
	}
	ev.nfBy = {};
	for (let q = 0; q < n; q++) ev.nfBy[q] = ev.map((e, i) => (e.seat === q && e.nf ? i : -1)).filter((i) => i >= 0);
	const seq = consumed.map(() => []);
	const idx = (q, k) => consumed.findIndex((c) => c.seat === q && c.pile === k);
	const sizeAt = (i) => info.sizes[consumed[i].pile] - seq[i].length; // cards still in the pile
	// when a card that lies on the pile after the event `last` (or from the deal) becomes open
	const opens = (i) => {
		const l = seq[i];
		if (!l.length) return 0;
		const last = l[l.length - 1];
		let f = last.idx + 1;
		if (!ev[last.idx].show) while (f < ev.length && ev[f].trick === ev[last.idx].trick) f++;
		return f;
	};
	// forward in time, the events one by one: the card must have been allowed to lie open since the card before it
	// in the pile was taken (a trick later, or at once for a shown card); depth first with a budget of steps
	let budget = 400; // a failing search is cut early: a new attempt (another random order) is cheaper than a long backtrack
	const dfs = (t) => {
		if (t === ev.length) {
			return consumed.every((c, i) => seq[i].length === c.left && !exposedWrong(ev, c.seat, info.cards[c.seat][c.pile].top, opens(i), ev.length, foolTrump));
		}
		if (--budget < 0) return false;
		const e = ev[t];
		let ownLeft = 0;
		consumed.forEach((c, i) => { if (c.seat === e.seat) ownLeft += sizeAt(i); });
		const ok = consumed.map((c, i) => i).filter((i) => {
			const c = consumed[i];
			if (seq[i].length >= c.left || sizeAt(i) <= 0) return false;
			if (c.seat !== e.seat && ownLeft > 0) return false;
			return !exposedWrong(ev, c.seat, e.card, opens(i), t, foolTrump);
		});
		shuffled(ok, rng);
		for (const i of ok) {
			seq[i].push({ card: e.card, idx: t });
			const c = consumed[i];
			// a pile that has given all its cards shows its current top from now to the end: check it at once
			const full = seq[i].length === c.left;
			if ((!full || !exposedWrong(ev, c.seat, info.cards[c.seat][c.pile].top, opens(i), ev.length, foolTrump)) && dfs(t + 1)) return true;
			seq[i].pop();
		}
		return false;
	};
	if (!dfs(0)) return null;
	const cards = shuffled(info.pool.slice(), rng);
	let used = 0;
	const out = {};
	for (let q = 0; q < n; q++) {
		out[q] = info.cards[q].map((p, k) => {
			const cover = p.size - (p.top ? 1 : 0);
			const under = cards.slice(used, used + cover);
			used += cover;
			// bottom first: the covered cards, the open top, then the taken cards (the one taken first is on top)
			return [...under, ...(p.top ? [p.top] : []), ...seq[idx(q, k)].map((x) => x.card).reverse()];
		});
	}
	return { piles: out, events: ev };
}

function rebuildPiles(game, view, info, p, seed) {
	const steps = p.events.map((e) => ({ seat: e.seat, action: { type: e.show ? 'show_fool' : 'play', card: e.card } }));
	return replay(game, view, info, seed, { piles: p.piles, rest: [] }, steps);
}

// World number i: tries a few samples; {hand, attempts} or null.
export function sampleExt(game, view, info, level, makeRng, seed, i) {
	const tries = info.piles ? 24 : 8;
	for (let attempt = 0; attempt < tries; attempt++) {
		const rng = makeRng(`${seed}:w${i}:${attempt}`);
		const p = info.piles ? samplePiles(info, rng) : sampleRepeat(info, level, rng, attempt);
		if (!p) continue;
		const hand = info.piles ? rebuildPiles(game, view, info, p, `${seed}:h${i}`) : rebuildRepeat(game, view, info, p, `${seed}:h${i}`);
		if (hand) return { hand, attempts: attempt + 1 };
	}
	return null;
}
