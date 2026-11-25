// Worlds for games with contracts, an exchange, a called partner or declarations. Input is the seat's view only.
// The hidden hands are sampled as they stand AFTER the exchange (the hands the play starts from). To rebuild the hand in
// the core, the public history is replayed (bids, laid count, called cards, the call of the partner, declarations) on a
// deal made so that every called card lies with someone else than the declarer; the hands, the discards and the rest
// are then set to the sampled ones just before the first phase after the exchange is entered. The rebuilt view must
// equal the real one. See docs/BOT.md.
import { newHand } from '../core/index.js';
import { roleValue, seatAt } from '../core/util.js';
import { catOf } from './policy.js';

// why the last world was refused (for the lab and the tests)
export const why = { last: '' };
const no = (r) => { why.last = r; return null; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const MODULES = ['bidding', 'exchange', 'call_partner', 'declarations'];
const LATE = ['call_partner', 'declarations', 'tricks'];

// does this game have anything the contract worlds are for?
export const hasContracts = (game) => game.plan.some((e) => MODULES.includes(e.module));

// the plan index of the first phase entered after the exchange (the hands are set before it enters)
function patchIndex(game) {
	const ex = game.plan.findIndex((e) => e.module === 'exchange');
	if (ex >= 0) return ex + 1;
	return game.plan.findIndex((e) => LATE.includes(e.module));
}

function shuffled(arr, rng) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = rng.int(i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// What the contract part of the view adds to the base info. The play must have started (the phase is the tricks).
export function prepareContract(game, view, base) {
	if (!base.ok) return base;
	const me = view.seat;
	const c = view.contract || null;
	const ex = view.exchange || null;
	const decl = c ? c.declarer : null;
	// the cards called in the exchange (the card called as a partner is not one of them: it lies with its holder)
	const called = ex ? ex.called.slice() : [];
	const played = new Set(base.plays.map((p) => p.card));
	const inHand = new Set(view.hand);
	const fixed = {};
	const add = (q, card) => {
		if (q === me || played.has(card) || inHand.has(card)) return;
		(fixed[q] = fixed[q] || []);
		if (!fixed[q].includes(card)) fixed[q].push(card);
	};
	// every called card is with the declarer after the exchange (a call of the declarer's own card is no exchange)
	if (decl !== null && decl !== me) for (const card of called) add(decl, card);
	// exposed declarations show cards of a seat
	const made = (view.declarations && view.declarations.made) || [];
	for (const d of made) if (d.cards) for (const card of d.cards) add(d.seat, card);
	// the laid cards of the declarer (only he sees them) lie in the hands of the other seats
	const laid = decl === me && ex && ex.mine ? ex.mine.laid.filter((x) => !played.has(x)) : [];
	return { ...base, contract: true, decl, called, fixed, laid, made, bids: (view.bidding && view.bidding.bids) || [], laidCount: ex ? ex.laid : c ? c.laid : 0, partnerCard: view.call ? view.call.card : null };
}

// The sampled hands after the exchange: {P, D, tail}, or null when the voids cannot be met.
function placeContract(info, level, rng, attempt, place) {
	const { n, me } = info;
	const fixedCards = new Set();
	for (const q of Object.keys(info.fixed)) for (const card of info.fixed[q]) fixedCards.add(card);
	const laidSet = new Set(info.laid);
	const pool = info.pool.filter((x) => !fixedCards.has(x) && !laidSet.has(x));
	const handNeed = { ...info.handNeed };
	for (const q of Object.keys(info.fixed)) handNeed[q] -= info.fixed[q].length;
	// the laid cards: into the hands of the other seats, by room and voids
	const placedL = {};
	const voidOf = (q, c) => info.voids.some((v) => v.seat === q && v.cat === catOf(c));
	for (const card of shuffled(info.laid.slice(), rng)) {
		const seats = [];
		for (let q = 0; q < n; q++) if (q !== me && handNeed[q] > 0 && !voidOf(q, card)) seats.push(q);
		if (!seats.length) return null;
		const q = seats[rng.int(seats.length)];
		handNeed[q]--;
		(placedL[q] = placedL[q] || []).push(card);
	}
	if (Object.values(handNeed).some((x) => x < 0)) return null;
	const p = place({ ...info, pool, handNeed }, level, rng, attempt);
	if (!p) return null;
	const P = {};
	for (let q = 0; q < n; q++) {
		if (q === me) P[q] = [];
		else P[q] = [...(info.fixed[q] || []), ...(placedL[q] || []), ...p.hands[q]];
	}
	return { P, D: p.discards, stockOrder: p.stockOrder, tail: p.tail };
}

// the order the dealer gives later cards in, as the deal module takes them (from the right of the dealer)
function dealOrder(game, dealer, n) {
	const d = game.plan.find((e) => e.module === 'deal');
	const step = d && d.set.order === 'from_left' ? -1 : 1;
	return Array.from({ length: n }, (_, i) => seatAt(dealer, (i + 1) * step, n));
}

// The deal of the replay: the first deal gives each seat its first cards, later deals (from the rest) get the others.
function presetOf(game, view, info, P, D, later) {
	const { n, me } = info;
	const deals = game.plan.filter((e) => e.module === 'deal');
	const first = deals.find((e) => e.set.from !== 'rest') || deals[0];
	const all = {};
	for (let q = 0; q < n; q++) all[q] = [...P[q], ...info.played[q], ...D[q]];
	const hands = {};
	const rest = [];
	const hasLater = deals.some((e) => e !== first);
	for (let q = 0; q < n; q++) {
		let k = all[q].length;
		if (hasLater) k = roleValue(first.set.hand_size, q, view.dealer) + (q === view.dealer ? first.set.dealer_extra || 0 : 0);
		hands[q] = all[q].slice(0, k);
	}
	if (hasLater) for (const q of dealOrder(game, view.dealer, n)) rest.push(...all[q].slice(hands[q].length));
	rest.push(...later);
	return { hands, rest, me };
}

// Called cards must not lie with the declarer in the deal that is replayed: swap each with a card of another seat.
function moveCalled(preset, info, rng) {
	const { n, decl } = info;
	if (decl === null || !info.called.length) return preset;
	const hands = {};
	for (let q = 0; q < n; q++) hands[q] = preset.hands[q].slice();
	const rest = preset.rest.slice();
	const callSet = new Set(info.called);
	for (const card of info.called) {
		const at = hands[decl].indexOf(card);
		if (at < 0) continue;
		const others = [];
		for (let q = 0; q < n; q++) if (q !== decl) for (let i = 0; i < hands[q].length; i++) if (!callSet.has(hands[q][i])) others.push([q, i]);
		if (!others.length) return null;
		const [q, i] = others[rng.int(others.length)];
		[hands[decl][at], hands[q][i]] = [hands[q][i], hands[decl][at]];
	}
	return { ...preset, hands, rest };
}

// Rebuilds the deal as a Hand at the seat's decision. null when it does not match the view.
function rebuildContract(game, view, info, p, seed, rng) {
	const { n, me } = info;
	const P = { ...p.P };
	P[me] = [...view.hand];
	const Pfull = {};
	for (let q = 0; q < n; q++) Pfull[q] = [...P[q], ...info.played[q]];
	const D = { ...p.D };
	D[me] = view.discard.mine.slice();
	let preset = presetOf(game, view, info, P, D, [...p.stockOrder, ...p.tail]);
	preset = moveCalled(preset, info, rng);
	if (!preset) return no('swap');
	let carry = null;
	if (info.lead !== null && info.lead !== undefined) carry = { lastTaker: info.lead };
	else if (info.carryMatters) carry = { lastTaker: rng.int(n) };
	const at = patchIndex(game);
	const saved = [];
	let patched = false;
	const patch = (h) => {
		if (patched) return;
		patched = true;
		for (let q = 0; q < n; q++) { h.s.hands[q] = Pfull[q].slice(); h.s.discard[q] = D[q].slice(); }
		h.s.rest = [...p.stockOrder, ...p.tail];
	};
	// the first phases entered after the exchange set the hands first (their enter looks at the hands)
	if (at >= 0) {
		for (let i = at; i < game.plan.length; i++) {
			const e = game.plan[i];
			if (!e.mod) continue;
			const orig = e.mod;
			saved.push([e, orig]);
			e.mod = { ...orig, enter: (h2) => { patch(h2); return orig.enter(h2); } };
		}
	}
	let h;
	try {
		h = newHand(game, { seed, dealer: view.dealer, preset: { hands: preset.hands, rest: preset.rest }, carry });
		if (!prelude(game, view, info, h, D, patch)) return no('prelude ' + why.last);
		for (const { seat, card } of info.plays) if (!h.apply(seat, { type: 'play', card }).ok) return no('replay of a play');
	} catch (e) {
		return no('throw ' + e.message);
	} finally {
		for (const [e, orig] of saved) e.mod = orig;
	}
	if (h.isOver() || !h.toAct().includes(me)) return no('not my turn');
	const v = h.view(me);
	for (const k of ['hand', 'legal', 'tricks', 'trick', 'discard', 'contract', 'sides']) if (!same(v[k], view[k])) return no('view differs in ' + k);
	return h;
}

// Plays the public history before the first card: the passes of a_monte, the discards, the bids, the exchange, the
// call of the partner and the declarations. false when the core refuses a step.
function prelude(game, view, info, h, D, patch) {
	const left = {};
	for (const q of Object.keys(D)) left[q] = D[q].slice();
	let bi = 0;
	let layN = 0;
	const calls = info.called.slice();
	const mades = info.made.map((d) => ({ ...d, used: false }));
	for (let guard = 0; guard < 600 && !h.isOver(); guard++) {
		const m = h.cur.module;
		if (m === 'tricks') break;
		const seat = h.toAct()[0];
		if (seat === undefined) { why.last = 'nobody to act in ' + m; return false; }
		const legal = h.legal(seat);
		let a = null;
		if (m === 'a_monte') a = legal.find((x) => x.type === 'a_monte_pass');
		else if (m === 'discard') {
			const want = left[seat] && left[seat].shift();
			a = legal.find((x) => x.card === want) || legal[0];
		} else if (m === 'bidding') {
			const b = info.bids[bi++];
			if (!b || b.seat !== seat) { why.last = 'bid order'; return false; }
			a = legal.find((x) => x.type === (b.bid === 'pass' ? 'pass' : 'bid_' + b.bid));
		} else if (m === 'exchange') {
			if (legal.some((x) => x.type === 'lay_down' || x.type === 'lay_done')) {
				if (layN < info.laidCount) { a = legal.find((x) => x.type === 'lay_down'); layN++; } else a = legal.find((x) => x.type === 'lay_done');
			} else if (legal.some((x) => x.type === 'call')) {
				const want = calls.shift();
				a = legal.find((x) => x.type === 'call' && x.card === want);
			}
		} else if (m === 'call_partner') a = legal.find((x) => x.card === info.partnerCard);
		else if (m === 'declarations') {
			const d = mades.find((x) => !x.used && x.seat === seat);
			if (d) { d.used = true; a = legal.find((x) => x.type === 'declare_' + d.kind); } else a = legal.find((x) => x.type === 'declare_done');
		}
		if (!a || !h.apply(seat, a).ok) { why.last = 'step in ' + m + ' ' + (a ? a.type : 'none'); return false; }
	}
	patch(h);
	return !h.isOver();
}

// World number i: {hand, attempts} or null.
export function sampleContract(game, view, info, level, makeRng, seed, i, place) {
	for (let attempt = 0; attempt < 8; attempt++) {
		const rng = makeRng(`${seed}:w${i}:${attempt}`);
		const p = placeContract(info, level, rng, attempt, place);
		if (!p) { no('place'); continue; }
		const hand = rebuildContract(game, view, info, p, `${seed}:h${i}`, rng);
		if (hand) return { hand, attempts: attempt + 1 };
	}
	return null;
}
