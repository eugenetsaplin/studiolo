// count: the Fool's exchange (the owner gives one plain card of his won cards for the Fool he took back), then the
// points of every seat or side, in twelfths of a book point. The discard counts for whom the discard says, or the
// count's dealer_forfeit says when it is given (one discard).
import { FOOL, INDEX } from '../cards.js';
import { countTwelfths } from '../points.js';
import { seatsOfSide, seatAt } from '../util.js';

export const name = 'count';
export const version = '1.0.0';

export const supports = {
	count_unit: ['half_point'],
	group: (v) => [1, 2, 3, 4].includes(v) || 'the group must be 1, 2, 3 or 4 (an option reference is resolved at load)',
	plain_value: (v) => typeof v === 'number' || 'must be a number',
	odd_card: ['half_point', 'drop', 'as_group'],
	trick_multipliers: [false],
	last_trick_bonus: [0],
	dealer_forfeit: [true, false],
	fool_card: ['counted'],
};

function ownerOfFool(s) {
	for (const t of s.tricks) if (t.fool !== null) return { owner: t.fool, rec: t };
	// a Fool shown on the owner's own turn lies among his won cards, in no trick
	if (s.shown) for (let q = 0; q < s.shown.length; q++) if (s.shown[q].includes(FOOL)) return { owner: q, rec: null };
	return null;
}

function receiverOf(h, owner, rec) {
	const cfg = h.game.cfg.cards;
	if (cfg.fool_exchange_to === 'trick_winner' && rec) return rec.winner;
	const sides = h.sides();
	for (let i = 1; i < h.s.n; i++) {
		const q = seatAt(owner, i, h.s.n);
		if (sides.of[q] !== sides.of[owner]) return q;
	}
	return rec ? rec.winner : owner;
}

// the plain cards among the candidates (the cheapest ones when none is plain)
function plainOptions(h, cands) {
	const v = h.game.tables.values.v;
	const plain = cands.filter((c) => v[c] <= 1);
	if (plain.length) return plain;
	const min = Math.min(...cands.map((c) => v[c]));
	return cands.filter((c) => v[c] === min);
}

function transfer(s, from, to, card) {
	for (let q = 0; q < s.n; q++) {
		const at = s.won[q].indexOf(card);
		if (at >= 0) { s.won[q].splice(at, 1); break; }
	}
	s.won[to].push(card);
}

export function enter(h) {
	const s = h.s;
	const cc = h.game.cfg.cards;
	const events = [];
	s.m.count = { waiting: false };
	const f = ownerOfFool(s);
	if (f && cc.fool_exchange !== false && cc.fool !== 'trump') {
		const { owner, rec } = f;
		const sides = h.sides();
		const to = receiverOf(h, owner, rec);
		const cands = [];
		for (const q of seatsOfSide(sides, sides.of[owner])) for (const c of s.won[q]) if (c !== FOOL) cands.push(c);
		if (sides.pool === 'side' && sides.of[to] === sides.of[owner]) {
			// the one who took the trick is on the owner's own side and the side counts one heap: the card would only
			// pass from one hand of the heap to another, so there is no exchange, no question and no event
		} else if (!cands.length) {
			if (cc.fool_no_tricks === 'give_fool') {
				transfer(s, owner, to, FOOL);
				s.foolGive = { from: owner, to, options: [], card: FOOL };
				events.push({ e: 'fool_given', from: owner, to, card: FOOL });
			}
		} else if (cc.fool_exchange_card === 'owner_choice') {
			s.foolGive = { from: owner, to, options: plainOptions(h, cands).sort((a, b) => INDEX[a] - INDEX[b]), card: null };
			s.m.count.waiting = true;
			return { events, done: false };
		} else {
			const v = h.game.tables.values.v;
			let best = null;
			for (const c of cands) {
				if (best === null || v[c] < v[best] || (v[c] === v[best] && INDEX[c] < INDEX[best])) best = c;
			}
			transfer(s, owner, to, best);
			s.foolGive = { from: owner, to, options: [], card: best };
			events.push({ e: 'fool_given', from: owner, to, card: best });
		}
	}
	events.push(finish(h));
	return { events, done: true };
}

export function toAct(h) {
	const m = h.s.m.count;
	return m && m.waiting ? [h.s.foolGive.from] : [];
}

export function legal(h, seat) {
	const g = h.s.foolGive;
	if (!g || g.card !== null || g.from !== seat) return [];
	return g.options.map((card) => ({ type: 'fool_give', card }));
}

export function apply(h, seat, action) {
	const s = h.s;
	const g = s.foolGive;
	transfer(s, g.from, g.to, action.card);
	g.card = action.card;
	g.options = [];
	s.m.count.waiting = false;
	return { events: [{ e: 'fool_given', from: g.from, to: g.to, card: action.card }, finish(h)], done: true };
}

// which seat the discard of a record counts for
export function keeperOf(h, rec, forfeit) {
	const s = h.s;
	let rule = rec.counts_for;
	if (forfeit !== undefined && s.m.discards.length <= 1 && rule !== 'nobody') rule = forfeit ? 'discarder_unless_no_tricks' : 'discarder';
	if (rule === 'nobody') return null;
	if (rule === 'dealer') return s.dealer;
	if (rule === 'discarder_unless_no_tricks') {
		const sideOf = h.sides().of;
		if (s.tricks.length === 0 || s.tricks.some((t) => sideOf[t.winner] === sideOf[rec.seat])) return rec.seat;
		return s.tricks[s.tricks.length - 1].winner;
	}
	return rec.seat;
}

// the options of the count of this game
function countOptions(set, table) {
	return { table, group: set.group || 2, oddCard: set.odd_card || 'half_point', plainValue: set.plain_value === undefined ? 1 : set.plain_value };
}

// the book points the seat (its side, with pooled sides) has won so far: the same count the count phase makes at the end
export function livePoints(h, seat) {
	const e = h.entry('count');
	if (!e) return 0;
	const sides = h.sides();
	const seats = sides.pool === 'side' ? seatsOfSide(sides, sides.of[seat]) : [seat];
	const won = [];
	for (const q of seats) won.push(...h.s.won[q]);
	return countTwelfths(won, countOptions(e.set, h.game.tables.values)) / 12;
}

function finish(h) {
	const s = h.s;
	const set = h.cur.set;
	const sides = h.sides();
	const table = h.game.tables.values;
	const opt = countOptions(set, table);
	const pool = sides.pool === 'side';
	// units: the seats counted together
	const units = [];
	if (pool) { const seen = new Set(); for (const sd of sides.of) if (!seen.has(sd)) { seen.add(sd); units.push(seatsOfSide(sides, sd)); } }
	else for (let q = 0; q < s.n; q++) units.push([q]);
	const kept = {};
	for (const rec of s.m.discards || []) {
		const k = keeperOf(h, rec, set.dealer_forfeit);
		if (k !== null) (kept[k] = kept[k] || []).push(...s.discard[rec.seat]);
	}
	const drawnBy = {};
	for (const d of s.drawn) (drawnBy[d.seat] = drawnBy[d.seat] || new Set()).add(d.card);
	const fg = s.foolGive && s.foolGive.card ? s.foolGive : null;
	const points = {};
	const sidePoints = {};
	const breakdown = {};
	const unitTotals = [];
	// the lines of the breakdown are steps of one count of the unit's own heap, so they add up to the total whatever the
	// group is (one card alone is worth a part of a point at groups of three or four, a step never is): the cards of the
	// tricks, then the stock cards drawn, then the Fool's exchange, then the discard kept
	for (const seats of units) {
		const after = [];
		const disc = [];
		for (const q of seats) { after.push(...s.won[q]); disc.push(...(kept[q] || [])); }
		const total = countTwelfths([...after, ...disc], opt);
		// the heap before the exchange: the card given for the Fool goes back to the one who gave it
		const before = after.slice();
		if (fg && seats.includes(fg.to) && !seats.includes(fg.from)) { const at = before.indexOf(fg.card); if (at >= 0) before.splice(at, 1); }
		else if (fg && seats.includes(fg.from) && !seats.includes(fg.to)) before.push(fg.card);
		const drawn = (c) => seats.some((q) => drawnBy[q] && drawnBy[q].has(c));
		const wonTw = countTwelfths(before.filter((c) => !drawn(c)), opt);
		const beforeTw = countTwelfths(before, opt);
		const afterTw = countTwelfths(after, opt);
		const bd = { won: wonTw, discard: total - afterTw, fool: afterTw - beforeTw, stock: beforeTw - wonTw };
		unitTotals.push({ seats, total, bd });
	}
	for (const u of unitTotals) {
		for (const q of u.seats) { points[q] = u.total; breakdown[q] = { ...u.bd }; }
	}
	for (let q = 0; q < s.n; q++) {
		const sd = sides.of[q];
		if (!(sd in sidePoints)) sidePoints[sd] = 0;
	}
	if (pool) for (const u of unitTotals) sidePoints[sides.of[u.seats[0]]] = u.total;
	else { for (const k of Object.keys(sidePoints)) sidePoints[k] = 0; for (let q = 0; q < s.n; q++) sidePoints[sides.of[q]] += points[q]; }
	s.m.count.points = points;
	s.m.count.sidePoints = sidePoints;
	s.m.count.breakdown = breakdown;
	return { e: 'counted', points: { ...points } };
}
