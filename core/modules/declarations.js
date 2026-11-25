// declarations: announcing honours, trumps and the like before the first card is played (one turn per seat, in play
// order from the first leader). A seat sees only the kinds its hand qualifies for, one at a time, and may say it is done;
// a seat that does not speak in its turn loses the right (`late right_lost`: the window closes with the turn).
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
export function qualifies(h, kind, seat) {
	const pred = compileSelector(kind.of, h.game.env);
	const cards = h.s.hands[seat].filter((c) => pred(c));
	if (cards.length < kind.min) return null;
	if (kind.all_of && cards.length !== ALL.filter((c) => pred(c)).length) return null;
	return { n: cards.length, cards };
}

function offerOf(h, entry, seat) {
	const m = h.s.m[entry.id];
	return entry.set.kinds.filter((k) => !m.made.some((d) => d.seat === seat && d.kind === k.id) && qualifies(h, k, seat));
}

// the seat that leads the first trick: the declaring turns follow the play order from there
function firstLeader(h) {
	const s = h.s;
	const t = h.entry('tricks');
	const set = t ? t.set : {};
	if (set.first_leader === 'previous_last_taker' && s.carry && Number.isInteger(s.carry.lastTaker)) return s.carry.lastTaker;
	return seatAt(s.dealer, 1, s.n);
}

function declare(h, entry, seat, kind) {
	const m = h.s.m[entry.id];
	const q = qualifies(h, kind, seat);
	const rec = { seat, kind: kind.id, n: q.n };
	if (kind.show === 'expose') rec.cards = q.cards.slice();
	m.made.push(rec);
	const amount = kindAmount(kind, q.n, h.game.options);
	if (amount) for (let o = 0; o < h.s.n; o++) if (o !== seat) m.paid.push({ from: o, to: seat, amount, why: 'declaration', kind: kind.id });
	const ev = { e: 'declared', seat, kind: kind.id, n: q.n };
	if (rec.cards) ev.cards = rec.cards.slice();
	return ev;
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
		for (const seat of order) for (const k of offerOf(h, entry, seat)) events.push(declare(h, entry, seat, k));
		m.at = order.length;
		return { events, done: true };
	}
	return { events: [], done: nextTurn(h, entry) };
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
		events.push(declare(h, entry, seat, kind));
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
	const open = !h.s.over && h.cur === e;
	const shown = m ? m.made.map((d) => ({ ...d, ...(d.cards ? { cards: d.cards.slice() } : {}) })) : [];
	const offer = open && toAct(h).includes(seat) ? offerOf(h, e, seat).map((k) => k.id) : [];
	return { open, made: shown, offer };
}

// the engine adds this part to the view of every seat (view.declarations)
export function viewPart(h, entry, seat) {
	return { declarations: viewOf(h, seat) };
}
