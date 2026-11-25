// discard: cards put away from the hand, one card per action, repeated `count` times. «Ho scartato» is implicit when
// the count is reached. Barred cards: the honours (discard_honours_barred), `barred`, less the allowed exceptions.
// If every card left in the discarder's hand is barred, all of them become discardable (engine default).
// The conditions of the exceptions (hand_lacks, hand_count, ...) are judged on the hand AS DEALT to this discard:
// the cards the seat has already put away in this phase still count as held (rules revision 2). Else a dealer could
// put another trump away first and so «free» the Bagatto.
import { compileSelector, conditionUnsupported } from '../selectors.js';
import { isObj, roleValue, seatAt } from '../util.js';

export const name = 'discard';
export const version = '1.1.0';

function selectorOk(sel, env) {
	try { compileSelector(sel, env); return true; } catch { return false; }
}

export const supports = {
	who: ['dealer', 'each'],
	count: (v) => (Number.isInteger(v) && v >= 0) || (isObj(v) && isObj(v.by_role)) || 'bad count',
	count_mode: ['exact'],
	discard_honours_barred: [true, false],
	barred: (v, ctx) => (Array.isArray(v) && v.every((x) => selectorOk(x, ctx.env))) || 'bad selector',
	allowed_exceptions: (v, ctx) => {
		if (!Array.isArray(v)) return 'must be a list';
		for (const e of v) {
			if (!isObj(e) || !selectorOk(e, ctx.env)) return 'bad selector';
			if (e.if && conditionUnsupported(e.if).length) return 'the condition ' + conditionUnsupported(e.if).join(', ') + ' is not played';
		}
		return true;
	},
	counts_for: ['discarder', 'dealer', 'nobody', 'discarder_unless_no_tricks'],
	announce: '*',
	face: ['down'],
};

export function check(set, ctx) {
	const bad = [];
	if (set.who === 'each' && set.count !== undefined && ctx.seats > 1) { /* each seat discards its own count */ }
	return bad;
}

// the honours: set:honours when the file defines it, else the counters worth 5
function barredPredicate(h, set) {
	const env = h.game.env;
	const cfg = h.game.cfg;
	const parts = [];
	if (set.discard_honours_barred !== false) {
		if (cfg.cards.sets && cfg.cards.sets.honours) parts.push(compileSelector('set:honours', env));
		else { const v = h.game.tables.values.v; parts.push((c) => v[c] >= 5); }
	}
	for (const b of set.barred || []) parts.push(compileSelector(b, env));
	const exc = (set.allowed_exceptions || []).map((e) => compileSelector(e, env));
	return (c, scope) => parts.some((p) => p(c, scope)) && !exc.some((p) => p(c, scope));
}

export function enter(h) {
	const s = h.s;
	const set = h.cur.set;
	const queue = set.who === 'each' ? Array.from({ length: s.n }, (_, i) => seatAt(s.dealer, i + 1, s.n)) : [s.dealer];
	const counts = {};
	for (const q of queue) counts[q] = roleValue(set.count, q, s.dealer) || 0;
	s.m[h.cur.id] = { queue: queue.filter((q) => counts[q] > 0), at: 0, left: 0, counts };
	const m = s.m[h.cur.id];
	if (!m.queue.length) return { events: [], done: true };
	m.left = counts[m.queue[0]];
	if (!s.m.discards) s.m.discards = [];
	// one record per seat: the count adds all of a seat's discard once, whatever number of discard phases there were
	for (const q of m.queue) if (!s.m.discards.some((d) => d.seat === q)) s.m.discards.push({ seat: q, counts_for: set.counts_for || 'discarder' });
	return { events: [], done: false };
}

export function toAct(h) {
	const m = h.s.m[h.cur.id];
	return m && m.at < m.queue.length ? [m.queue[m.at]] : [];
}

export function legal(h, seat) {
	const hand = h.s.hands[seat];
	const bar = barredPredicate(h, h.cur.set);
	const m = h.s.m[h.cur.id];
	const put = m && m.queue[m.at] === seat ? m.counts[seat] - m.left : 0; // cards this seat has put away in this phase
	const scope = { hand: put > 0 ? hand.concat(h.s.discard[seat].slice(-put)) : hand };
	let ok = hand.filter((c) => !bar(c, scope));
	if (!ok.length) ok = hand;
	return ok.map((card) => ({ type: 'discard', card }));
}

export function apply(h, seat, action) {
	const s = h.s;
	const m = s.m[h.cur.id];
	const hand = s.hands[seat];
	hand.splice(hand.indexOf(action.card), 1);
	s.discard[seat].push(action.card);
	m.left--;
	const events = [];
	if (m.left === 0) {
		events.push({ e: 'discarded', seat, n: m.counts[seat] });
		m.at++;
		if (m.at >= m.queue.length) return { events, done: true };
		m.left = m.counts[m.queue[m.at]];
	}
	return { events, done: false };
}
