// declarations: announcing honours, trumps and the like before the first card is played (one turn per seat, in play
// order from the first leader). A seat sees only the kinds its hand qualifies for, one at a time, and may say it is done;
// a seat that does not speak in its turn loses the right (`late right_lost`: the window closes with the turn).
// With window before_first_trick_covered there are no turns before the first card: every seat may declare at any moment of
// its own choice until the first trick is covered (before its card, and once more after the last card of the trick has
// lain, before the trick is closed; Torino 1787, p. 86). The tricks module asks this one: trickLegal, trickApply,
// beginClosing, closingSeats.
// Every declaration is paid at once by each other seat (`paid_by each_other`); the payments are kept in
// s.m[<phase id>].paid and handed to settle by payments.js. A kind shown with `expose` lays its cards open for the hand.
import { compileSelector } from '../selectors.js';
import { ALL } from '../cards.js';
import { isObj, seatAt } from '../util.js';
import { amountOf } from './settle.js';

export const name = 'declarations';
export const version = '1.0.0';

export const ACTION_PREFIX = 'declare_';
export const DONE = 'declare_done';
const SHOWS = ['announce_count', 'announce', 'expose'];

function selectorOk(sel, env) {
	try { compileSelector(sel, env); return true; } catch { return false; }
}

function tableOk(t) {
	if (!isObj(t)) return false;
	if (t.rows !== undefined && !isObj(t.rows)) return false;
	if (t.rows && !Object.entries(t.rows).every(([k, v]) => /^[0-9]+$/.test(k) && Number.isFinite(v))) return false;
	if (t.beyond !== undefined && !(isObj(t.beyond) && t.beyond.every > 0 && Number.isFinite(t.beyond.add))) return false;
	if (t.same_as_count !== undefined && typeof t.same_as_count !== 'boolean') return false;
	return true;
}

export function paysOk(v) {
	if (typeof v === 'number') return Number.isFinite(v) && v >= 0;
	if (isObj(v) && 'table' in v) return tableOk(v.table);
	return isObj(v) && ('stake' in v || 'option' in v || 'sum' in v || 'times' in v);
}

function kindsOk(v, ctx) {
	if (!Array.isArray(v) || !v.length) return 'a list of kinds';
	const ids = new Set();
	for (const k of v) {
		if (!isObj(k) || typeof k.id !== 'string' || !/^[a-z_]{1,16}$/.test(k.id)) return 'a kind needs an id of 1-16 letters a-z and _ (its action is declare_<id>, at most 24 characters)';
		if (ids.has(k.id)) return 'two kinds with the id ' + k.id;
		ids.add(k.id);
		if (!selectorOk(k.of, ctx.env)) return 'kind ' + k.id + ': bad selector in of';
		if (!Number.isInteger(k.min) || k.min < 1) return 'kind ' + k.id + ': min must be a whole number from 1';
		if (!SHOWS.includes(k.show)) return 'kind ' + k.id + ': show must be one of ' + SHOWS.join(', ');
		if (!paysOk(k.pays)) return 'kind ' + k.id + ': this pays amount is not played';
	}
	for (const k of v) {
		if (k.includes === undefined) continue;
		const inc = v.find((x) => x.id === k.includes);
		if (!inc || inc === k) return 'kind ' + k.id + ': includes names another kind of the list';
		if (inc.includes !== undefined) return 'kind ' + k.id + ': the kind it includes must not include another';
		if (inc.all_of) return 'kind ' + k.id + ': it cannot include a kind held whole (all_of)';
	}
	return true;
}

export const supports = {
	kinds: kindsOk,
	window: ['after_discard_before_first_card', 'before_first_trick_covered'],
	late: ['right_lost'],
	mode: ['manual', 'auto'],
	paid: ['at_once'],
	paid_by: ['each_other'],
};

// the amount a kind pays for n cards
export function kindAmount(kind, n, options) {
	const p = kind.pays;
	if (isObj(p) && 'table' in p) {
		const t = p.table;
		if (t.same_as_count) return n;
		const rows = t.rows || {};
		if (rows[String(n)] !== undefined) return rows[String(n)];
		const keys = Object.keys(rows).map(Number);
		const top = keys.length ? Math.max(...keys) : null;
		if (t.beyond && top !== null && n > top) return rows[String(top)] + Math.floor((n - top) / t.beyond.every) * t.beyond.add;
		return 0;
	}
	return amountOf(p, options);
}

const entryOf = (h) => h.game.plan.find((e) => e.module === 'declarations') || null;

// what the hand of a seat holds of a kind: {n, cards} or null when it does not qualify
// while the first trick is open the card the seat has put into it still counts (Torino 1787, p. 86: the declaring may
// be made until the first trick is covered)
export function qualifies(h, kind, seat) {
	const pred = compileSelector(kind.of, h.game.env);
	const played = inTrickWindow(entryOf(h)) && h.s.tricks.length === 0 && Array.isArray(h.s.trick)
		? h.s.trick.filter((t) => t.seat === seat).map((t) => t.card) : [];
	const cards = h.s.hands[seat].concat(played).filter((c) => pred(c));
	if (cards.length < kind.min) return null;
	if (kind.all_of && cards.length !== ALL.filter((c) => pred(c)).length) return null;
	return { n: cards.length, cards };
}

function offerOf(h, entry, seat) {
	const m = h.s.m[entry.id];
	// a kind carried by another one (via) stays on offer: naming it then pays nothing more
	return entry.set.kinds.filter((k) => !m.made.some((d) => d.seat === seat && d.kind === k.id && !d.via) && qualifies(h, k, seat));
}

// the seat that leads the first trick: the declaring turns follow the play order from there
function firstLeader(h) {
	const s = h.s;
	const t = h.entry('tricks');
	const set = t ? t.set : {};
	if (set.first_leader === 'previous_last_taker' && s.carry && Number.isInteger(s.carry.lastTaker)) return s.carry.lastTaker;
	return seatAt(s.dealer, 1, s.n);
}

// one declaration made: its events (the declared kind, then the kind it includes when that was not declared yet; a kind
// already carried by another is not paid again)
function declare(h, entry, seat, kind) {
	const m = h.s.m[entry.id];
	const q = qualifies(h, kind, seat);
	// the kind was paid with the kind that includes it: naming it now only makes it the seat's own word, nothing is paid
	const carried = m.made.find((d) => d.seat === seat && d.kind === kind.id && d.via);
	if (carried) { delete carried.via; return [{ e: 'declared', seat, kind: kind.id, n: carried.n }]; }
	const rec = { seat, kind: kind.id, n: q.n };
	if (kind.show === 'expose') rec.cards = q.cards.slice();
	m.made.push(rec);
	const pay = (k, n) => {
		const amount = kindAmount(k, n, h.game.options);
		if (amount) for (let o = 0; o < h.s.n; o++) if (o !== seat) m.paid.push({ from: o, to: seat, amount, why: 'declaration', kind: k.id });
	};
	pay(kind, q.n);
	const ev = { e: 'declared', seat, kind: kind.id, n: q.n };
	if (rec.cards) ev.cards = rec.cards.slice();
	const events = [ev];
	// a kind that includes another carries its payment: the included kind is paid with it unless they were declared already, and never twice
	const inc = kind.includes ? entry.set.kinds.find((k) => k.id === kind.includes) : null;
	if (inc && !m.made.some((d) => d.seat === seat && d.kind === inc.id)) {
		const qi = qualifies(h, inc, seat);
		if (qi) {
			m.made.push({ seat, kind: inc.id, n: qi.n, via: kind.id });
			pay(inc, qi.n);
			events.push({ e: 'declared', seat, kind: inc.id, n: qi.n });
		}
	}
	return events;
}

// move the turn to the next seat of the order that still has something to declare
function nextTurn(h, entry) {
	const m = h.s.m[entry.id];
	m.at++;
	while (m.at < m.order.length && !offerOf(h, entry, m.order[m.at]).length) m.at++;
	return m.at >= m.order.length;
}

export function enter(h) {
	const s = h.s;
	const entry = h.cur;
	const first = firstLeader(h);
	const order = Array.from({ length: s.n }, (_, i) => seatAt(first, i, s.n));
	s.m[entry.id] = { order, at: -1, made: [], paid: [] };
	const m = s.m[entry.id];
	if (entry.set.mode === 'auto') {
		const events = [];
		for (const seat of order) for (const k of offerOf(h, entry, seat)) if (offerOf(h, entry, seat).includes(k)) events.push(...declare(h, entry, seat, k));
		m.at = order.length;
		return { events, done: true };
	}
	// the window of the first trick: no turns before the first card, the tricks module asks for the declarations
	if (inTrickWindow(entry)) { m.at = order.length; return { events: [], done: true }; }
	return { events: [], done: nextTurn(h, entry) };
}

const inTrickWindow = (e) => !!e && e.set.window === 'before_first_trick_covered' && e.set.mode !== 'auto';

// the entry while declaring is still in time: the tricks run and the first trick is not closed
function trickEntry(h) {
	const e = entryOf(h);
	if (!inTrickWindow(e) || h.s.over || !h.s.m[e.id] || !h.cur || h.cur.module !== 'tricks' || h.s.tricks.length > 0) return null;
	return e;
}

const declareActions = (h, e, seat) => offerOf(h, e, seat).map((k) => ({ type: ACTION_PREFIX + k.id }));

// the index in the order of the first seat from `from` that still has something to declare, or -1
function nextClosing(h, e, from) {
	const m = h.s.m[e.id];
	for (let i = from; i < m.order.length; i++) if (offerOf(h, e, m.order[i]).length) return i;
	return -1;
}

// the declarations a seat may make now besides its card; in the closing window «continue» first, then the kinds
export function trickLegal(h, seat) {
	const e = trickEntry(h);
	if (!e) return [];
	const m = h.s.m[e.id];
	if (h.s.m.tricks.closing) return m.closing && m.order[m.closing.at] === seat ? [{ type: DONE }, ...declareActions(h, e, seat)] : [];
	if (h.s.m.tricks.turn !== seat || h.s.trick.length >= h.s.n) return [];
	return declareActions(h, e, seat);
}

// the seat that may declare while the last card of the first trick lies and the trick is not closed yet
export function closingSeats(h) {
	const e = trickEntry(h);
	const m = e && h.s.m[e.id];
	return m && m.closing ? [m.order[m.closing.at]] : [];
}

// the last card of the first trick has lain: true when somebody may still declare before the trick is closed
export function beginClosing(h) {
	const e = trickEntry(h);
	if (!e) return false;
	const at = nextClosing(h, e, 0);
	if (at < 0) return false;
	h.s.m[e.id].closing = { at };
	return true;
}

// a declaration or «continue» inside the tricks: {events, close}; close: nobody is left, the trick is to be closed
export function trickApply(h, seat, action) {
	const e = trickEntry(h);
	const m = h.s.m[e.id];
	const events = [];
	if (action.type !== DONE) events.push(...declare(h, e, seat, e.set.kinds.find((k) => ACTION_PREFIX + k.id === action.type)));
	if (!h.s.m.tricks.closing) return { events, close: false };
	if (action.type !== DONE && offerOf(h, e, seat).length) return { events, close: false };
	const at = nextClosing(h, e, m.closing.at + 1);
	if (at >= 0) { m.closing.at = at; return { events, close: false }; }
	m.closing = null;
	return { events, close: true };
}

export function toAct(h) {
	const m = h.s.m[h.cur.id];
	return m && m.at >= 0 && m.at < m.order.length ? [m.order[m.at]] : [];
}

export function legal(h, seat) {
	const out = offerOf(h, h.cur, seat).map((k) => ({ type: ACTION_PREFIX + k.id }));
	out.push({ type: DONE });
	return out;
}

export function apply(h, seat, action) {
	const entry = h.cur;
	const events = [];
	if (action.type !== DONE) {
		const kind = entry.set.kinds.find((k) => ACTION_PREFIX + k.id === action.type);
		events.push(...declare(h, entry, seat, kind));
		if (offerOf(h, entry, seat).length) return { events, done: false };
	}
	return { events, done: nextTurn(h, entry) };
}

// the declarations the hand made, in order: [{seat, kind, n, cards?}]
export function madeOf(h) {
	const e = entryOf(h);
	const m = e && h.s.m[e.id];
	return m ? m.made : [];
}

// the payments of the declarations of the hand
export function paidOf(h) {
	const e = entryOf(h);
	const m = e && h.s.m[e.id];
	return m ? m.paid.map((p) => ({ from: p.from, to: p.to, amount: p.amount, why: p.why })) : [];
}

// view.declarations for a seat: null in a game with no declarations phase
export function viewOf(h, seat) {
	const e = entryOf(h);
	if (!e) return null;
	const m = h.s.m[e.id];
	const te = trickEntry(h);
	const open = !h.s.over && (h.cur === e || !!te);
	const shown = m ? m.made.map((d) => ({ ...d, ...(d.cards ? { cards: d.cards.slice() } : {}) })) : [];
	if (te) return { open, made: shown, offer: trickLegal(h, seat).filter((a) => a.type !== DONE).map((a) => a.type.slice(ACTION_PREFIX.length)), closing: !!h.s.m.tricks.closing, inTrick: true };
	const offer = open && toAct(h).includes(seat) ? offerOf(h, e, seat).map((k) => k.id) : [];
	return { open, made: shown, offer };
}

// the engine adds this part to the view of every seat (view.declarations)
export function viewPart(h, entry, seat) {
	return { declarations: viewOf(h, seat) };
}
