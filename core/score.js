// The ready lines of the score panel after a hand (view.scoreLines; CORE_API.md section 3, View, PROTOCOL.md): one line for every
// entry of the file's view.score_panel.after_hand, in that order, with the rule path behind it and the numbers by unit
// (a seat, or a side when the game pools its cards) or by seat (payments). No words: the table names the lines.
// Built from the seat's own view (the result, the tricks it saw, the stock cards shown to it) and the rules, so a
// line tells nothing the seat does not learn at the end of the hand. The result itself is never changed.
import { cardTwelfths } from './points.js';
import { FOOL } from './cards.js';

const KEYS = ['pairs', 'groups', 'odd_card', 'fool_card', 'discard', 'stock_cards', 'declarations', 'premiums', 'bands', 'payments', 'running_total'];
export const SCORE_LINE_KEYS = KEYS;

const entryOf = (game, module) => game.plan.find((e) => e.module === module) || null;
const setOf = (game, module) => { const e = entryOf(game, module); return (e && e.set) || {}; };

// the rule path of a phase as the support check names it: hand.phases[id] or hand.phases[group].phases[id]
function phasePath(game, module) {
	const e = entryOf(game, module);
	if (!e) return null;
	return e.group ? `hand.phases[${e.group.id}].phases[${e.id}]` : `hand.phases[${e.id}]`;
}
const settingPath = (game, module, key) => { const p = phasePath(game, module); return p ? `${p}.settings.${key}` : null; };

// the units counted together: the sides of this hand (a contract made them), else every seat or every pooled side
export function unitsOfView(game, view) {
	const n = view.seats;
	const vs = view.sides;
	const of = vs && vs.of ? Array.from({ length: n }, (_, i) => vs.of[i]) : null;
	const byContract = game.sides && game.sides.mode === 'by_contract';
	if (of && byContract && !of.some((x) => x === null || x === undefined)) {
		if (vs.mode === 'each_for_self') return of.map((side, seat) => ({ id: `seat${seat}`, seats: [seat] }));
		const by = new Map();
		of.forEach((side, seat) => { if (!by.has(side)) by.set(side, []); by.get(side).push(seat); });
		return [...by].map(([side, seats]) => ({ id: `side${side}`, seats }));
	}
	const sides = game.sides || { of: Array.from({ length: n }, (_, i) => i), pool: 'seat' };
	if (sides.pool === 'side') {
		const by = new Map();
		for (let s = 0; s < n; s++) { const id = sides.of[s]; if (!by.has(id)) by.set(id, []); by.get(id).push(s); }
		return [...by].map(([id, seats]) => ({ id: `side${id}`, seats }));
	}
	return Array.from({ length: n }, (_, s) => ({ id: `seat${s}`, seats: [s] }));
}

function countSet(game) {
	const set = setOf(game, 'count');
	return { group: set.group || 2, oddCard: set.odd_card || 'half_point', plainValue: set.plain_value === undefined ? 1 : set.plain_value };
}

// the cards each seat took in the tricks it saw, and the stock cards shown to it
function wonOfView(view) {
	const won = Array.from({ length: view.seats }, () => []);
	const prize = Array.from({ length: view.seats }, () => []);
	const drawn = new Map(((view.stock && view.stock.drawn) || []).map((d) => [d.card, d.seat]));
	for (const t of view.tricks) {
		if (t.fool !== null && t.fool !== undefined) won[t.fool].push(FOOL);
		for (const c of t.cards) if (c.card !== FOOL) won[t.winner].push(c.card);
		if (t.prize) prize[drawn.has(t.prize) ? drawn.get(t.prize) : t.winner].push(t.prize);
	}
	const shown = (view.open_piles && view.open_piles.shown) || {};
	for (const [seat, cards] of Object.entries(shown)) for (const c of cards || []) if (!won[seat].includes(c)) won[seat].push(c);
	return { won, prize };
}

// the cards in groups as the book pairs them (highest with lowest): the twelfths of the full groups and of the odd cards
function grouped(cards, game, cs) {
	const table = game.tables.values;
	const g = cs.group;
	const rest = cards.map((c) => ({ card: c, v: table.v[c], tw: cardTwelfths(table, c, g, cs.plainValue) }));
	rest.sort((a, b) => b.v - a.v);
	const full = rest.length - (rest.length % g);
	const pool = rest.slice();
	let groupsTw = 0;
	for (let i = 0; i < full / g; i++) {
		groupsTw += pool.shift().tw;
		for (let k = 1; k < g; k++) groupsTw += pool.pop().tw;
	}
	let oddTw = 0;
	if (pool.length) {
		if (cs.oddCard === 'drop') oddTw = 0;
		else if (cs.oddCard === 'as_group') oddTw = pool.reduce((a, m) => a + 12 * table.v[m.card], 0) - 12 * (pool.length - 1);
		else oddTw = pool.reduce((a, m) => a + m.tw, 0);
	}
	return { groupsTw, oddTw, tw: groupsTw + oddTw };
}

// net stake by seat of the payments that pass a test
function netBySeat(n, payments, test) {
	const out = {};
	for (let q = 0; q < n; q++) out[q] = 0;
	for (const p of payments) if (test(p)) { out[p.from] -= p.amount; out[p.to] += p.amount; }
	return out;
}

/**
 * scoreLines(game, view) -> {units: [{id, seats}], totals: {unitId: twelfths}, lines: [{key, rule, by, unit, values}]}
 * or null before the end of the hand. `by` is "unit" (values by unit id) or "seat" (values by seat); `unit` is
 * "twelfths" (of a book point, as result.points) or "stake" (as result.payments[].amount).
 */
export function scoreLines(game, view) {
	const res = view.result;
	if (!res) return null;
	const n = view.seats;
	const after = (game.rules.view && game.rules.view.score_panel && game.rules.view.score_panel.after_hand) || ['groups'];
	const units = unitsOfView(game, view);
	const out = { units: units.map((u) => ({ id: u.id, seats: u.seats.slice() })), totals: {}, lines: [] };
	if (res.outcome === 'thrown_in') return out;
	const cs = countSet(game);
	const { won, prize } = wonOfView(view);
	const hasPrizeStock = ((game.hooks && game.hooks.tricks) || []).some((e) => e.module === 'prize_stock');
	const per = {};
	for (const u of units) {
		const bd = res.breakdown[u.seats[0]] || { won: 0, discard: 0, fool: 0, stock: 0 };
		const g = grouped(u.seats.flatMap((s) => won[s]), game, cs);
		// a card given for the Fool that came from the stock leaves the stock's cards, not the tricks' (as the table shows it)
		const moved = hasPrizeStock && cs.oddCard === 'half_point' ? bd.won - g.tw : 0;
		per[u.id] = { won: bd.won - moved, odd: g.oddTw, fool: bd.fool, discard: bd.discard, stock: bd.stock + moved, stockCards: u.seats.reduce((a, s) => a + prize[s].length, 0) };
		out.totals[u.id] = res.points[u.seats[0]];
	}
	const byUnit = (f) => Object.fromEntries(units.map((u) => [u.id, f(per[u.id], u)]));
	const pays = res.payments || [];
	const settle = setOf(game, 'settle');
	const fileIds = new Set((settle.payments || []).map((p) => p.id));
	const roundTarget = (game.cfg.match && game.cfg.match.round_target) || 0;
	for (const key of after) {
		let line = null;
		if (key === 'groups' || key === 'pairs') line = { rule: settingPath(game, 'count', 'group'), by: 'unit', unit: 'twelfths', values: byUnit((p) => p.won) };
		else if (key === 'odd_card') line = { rule: settingPath(game, 'count', 'odd_card'), by: 'unit', unit: 'twelfths', values: byUnit((p) => p.odd) };
		else if (key === 'fool_card') line = { rule: 'cards.fool_exchange', by: 'unit', unit: 'twelfths', values: byUnit((p) => p.fool) };
		else if (key === 'discard') line = { rule: settingPath(game, 'discard', 'counts_for'), by: 'unit', unit: 'twelfths', values: byUnit((p) => p.discard) };
		else if (key === 'stock_cards') line = { rule: phasePath(game, 'prize_stock'), by: 'unit', unit: 'twelfths', values: byUnit((p) => p.stock) };
		else if (key === 'declarations') line = { rule: phasePath(game, 'declarations'), by: 'seat', unit: 'stake', values: netBySeat(n, pays, (p) => p.why === 'declaration') };
		else if (key === 'premiums') line = { rule: settingPath(game, 'settle', 'payments'), by: 'seat', unit: 'stake', values: netBySeat(n, pays, (p) => fileIds.has(p.why)) };
		else if (key === 'bands') line = { rule: settingPath(game, 'result', 'bands'), by: 'unit', unit: 'twelfths', values: byUnit((p, u) => res.points[u.seats[0]]), band: res.band ? { ...res.band } : null };
		else if (key === 'payments') line = { rule: settingPath(game, 'settle', 'amount'), by: 'seat', unit: 'stake', values: netBySeat(n, pays, () => true) };
		else if (key === 'running_total') line = { rule: 'match.round_target', by: 'unit', unit: 'twelfths', values: byUnit((p, u) => (res.points[u.seats[0]] || 0) - roundTarget * 12) };
		if (line) out.lines.push({ key, ...line });
	}
	return out;
}
