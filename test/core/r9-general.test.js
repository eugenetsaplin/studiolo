// R9 general checks: the same questions put to every game file, every number of seats, every variant and every
// option value, so that one mistake of the core or of a file is caught in all the games at once.
//   1. the Fool's card goes to the taker of the trick (a partner of the owner: no points change sides)
//   2. the points of all sides together are the points of all counted cards in one pile (91 in pairs, 72 in fours)
//   3. every configuration loads and plays 30 hands to the end; hands with no winner are not above 15 %
//      (named ceiling: Trent'uno on four seats 35 %; see CEILINGS below); and, in a second test, a variant that a file
//      offers at a number of seats has no winner in at most 15 % and more than one winning side in at most 50 % of 200 hands
//   4. the declaration tables pay for every whole number from min to the most a hand can hold
// The seeds are fixed. On the game files of revision 9 these checks are meant to pass; a red one is a fault of the core or of a file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { configs, gameOf, playHand, countedCards, countTwelfths, seatCounts, gameIds } from './r9-lib.js';
import { DECK } from '../../core/index.js';
import { compileSelector } from '../../core/selectors.js';
import { kindAmount } from '../../core/modules/declarations.js';
import { handsBeforeTricks } from '../../core/support.js';

const ALL_CONFIGS = configs();
const HANDS = 30;

// Check 3: hands with no winner at most 15 %, except the configurations named below, each with its own ceiling and its reason.
const DEFAULT_CEILING = 0.15;
const CEILINGS = [
	// Trent'uno on four seats: random players often do not reach 31 before the pack is out
	[/^trentuno\/4( |$)/, 0.35, "Trent'uno on four seats: random players often do not reach 31 before the pack ends"],
];
const ceilingOf = (label) => { const c = CEILINGS.find(([re]) => re.test(label)); return c ? { max: c[1], why: c[2] } : { max: DEFAULT_CEILING, why: null }; };
// Configurations the file itself says the core cannot play yet: not a fault of the core or of the file. (None since
// revision 11: «a scaricare» of Sedici for three is played.)
const NOT_PLAYED_YET = new Map([]);

const names = (bad) => [...new Set(bad.map((b) => b.split(':')[0]))];

// ---- 1. the Fool's card ----
test('1. the Fool: its card goes to the taker of the trick; a partner taking it moves no points between sides', () => {
	const bad = [];
	let seen = 0;
	for (const c of ALL_CONFIGS) {
		let g;
		try { g = gameOf(c); } catch { continue; } // an unplayable configuration is judged by check 3
		for (let i = 0; i < 12; i++) {
			const h = playHand(g, 'fool' + i, i % c.seats);
			const fg = h.s.foolGive;
			const rec = h.s.tricks.find((t) => t.fool !== null);
			if (!fg || !fg.card || !rec) continue;
			seen++;
			const sides = h.sides().of;
			if (fg.to !== rec.winner) bad.push(`${c.label}: the card for the Fool went to seat ${fg.to}, the trick was taken by seat ${rec.winner}`);
			else if (sides[rec.winner] === sides[rec.fool] && sides[fg.to] !== sides[fg.from]) bad.push(`${c.label}: the partner took the trick, yet the card changed sides`);
		}
	}
	assert.ok(seen > 50, 'the hands played must meet the Fool exchange often enough (' + seen + ')');
	assert.deepEqual(names(bad), [], [...new Set(bad)].slice(0, 12).join('\n'));
});

// ---- 2. the sum of the points ----
test('2. the points of all sides together are the points of all counted cards in one pile', () => {
	const optsOf = (g) => { const e = g.plan.find((x) => x.module === 'count'); return { table: g.tables.values, group: e.set.group || 2, oddCard: e.set.odd_card || 'half_point', plainValue: e.set.plain_value === undefined ? 1 : e.set.plain_value }; };
	// the constants of the full pack
	const table = gameOf({ id: 'partita_3', seats: 3 }).tables.values;
	assert.equal(countTwelfths(DECK, { table, group: 2 }), 91 * 12);
	assert.equal(countTwelfths(DECK, { table, group: 4, oddCard: 'as_group' }), 72 * 12);
	const bad = [];
	const done = new Set();
	for (const c of ALL_CONFIGS) {
		let g;
		try { g = gameOf(c); } catch { continue; }
		// stake, coin and marca change no points: one try for them all
		const key = `${c.id}/${c.seats}/${c.variant || ''}/${c.options && !('group' in c.options) ? '' : JSON.stringify(c.options || {})}`;
		if (done.has(key)) continue;
		done.add(key);
		const count = g.plan.find((x) => x.module === 'count');
		if (g.plan.some((x) => x.module === 'discard' && x.set.counts_for === 'nobody')) continue;
		for (let i = 0; i < 3; i++) {
			const h = playHand(g, 'sum' + i, i % c.seats);
			const cards = [...countedCards(h)];
			// the cards a seat laid face down when it went out (a scaricare) are counted by nobody
			h.s.discard.forEach((l, q) => { if (!h.outSeats().includes(q)) cards.push(...l); });
			const sum = Object.values(h.s.m.count.sidePoints).reduce((a, b) => a + b, 0);
			const one = countTwelfths(cards, optsOf(g));
			if (sum !== one) bad.push(`${c.label}: the sides together ${sum / 12}, the same ${cards.length} cards in one pile ${one / 12}`);
			if (cards.length === 78 && count.set.group === 2 && (count.set.odd_card || 'half_point') === 'half_point' && sum !== 1092) bad.push(`${c.label}: all 78 cards in pairs give ${sum / 12}, not 91`);
			if (cards.length === 78 && count.set.group === 4 && sum !== 864) bad.push(`${c.label}: all 78 cards counted in fours give ${sum / 12}, not 72`);
		}
	}
	assert.deepEqual(names(bad), [], [...new Set(bad)].slice(0, 12).join('\n'));
});

// ---- 3. every configuration loads and plays ----
for (const c of ALL_CONFIGS) {
	test(`3. ${c.label}: loads and plays ${HANDS} hands, hands with no winner within the ceiling`, (t) => {
		if (NOT_PLAYED_YET.has(c.label)) return t.skip(NOT_PLAYED_YET.get(c.label));
		const g = gameOf(c); // throws: the file does not load, or the core says it cannot play it
		let none = 0;
		for (let i = 0; i < HANDS; i++) {
			const h = playHand(g, 'gen' + i, i % c.seats);
			if (!h.result().winners.length) none++;
		}
		const cap = ceilingOf(c.label);
		if (cap.why) t.diagnostic(`${c.label}: ${none} of ${HANDS} without a winner; ceiling ${cap.max * 100} %: ${cap.why}`);
		assert.ok(none / HANDS <= cap.max, `${none} of ${HANDS} hands have no winner (ceiling ${cap.max * 100} %)`);
	});
}

// ---- 3b. a variant that is offered: a winner in most hands, and rarely more than one ----
// A variant (and so a short form) is offered at a number of seats only if, in 200 hands of random players at that number
// of seats, at most 15 % have no winner and at most 50 % have more than one winner. A variant that fails is left out
// (left_out) or limited to the numbers of seats where it passes (patch.seats.count).
const GATE_HANDS = 200;
const GATE_NONE = 0.15;
const GATE_SHARED = 0.5;
// The second ceiling asks something only of a game won by comparing points (result.winner more_points or fewest_points): there a hand
// with several winning sides is a hand not settled. Where the winner is fixed by a threshold (threshold, declarer_threshold) or by
// the first to be out (first_out), several winners are the rule of the game, and only the first ceiling holds.
const COMPARES = new Set(['more_points', 'fewest_points']);
const winnerRuleOf = (g) => { const e = g.plan.find((x) => x.module === 'result'); const w = e && e.set && e.set.winner; return w && typeof w === 'object' ? w.value : w; };
for (const c of ALL_CONFIGS.filter((x) => x.variant && !x.options)) {
	test(`3b. ${c.label}: ${GATE_HANDS} hands, no winner at most ${GATE_NONE * 100} %, more than one winner at most ${GATE_SHARED * 100} %`, (t) => {
		if (NOT_PLAYED_YET.has(c.label)) return t.skip(NOT_PLAYED_YET.get(c.label));
		const g = gameOf(c);
		let none = 0, shared = 0;
		for (let i = 0; i < GATE_HANDS; i++) {
			const h = playHand(g, 'gate' + i, i % c.seats);
			const of = h.sides().of; // partners win together: the winners are counted by side
			const w = new Set(h.result().winners.map((q) => of[q])).size;
			if (!w) none++; else if (w > 1) shared++;
		}
		const cap = ceilingOf(c.label);
		assert.ok(none / GATE_HANDS <= Math.max(GATE_NONE, cap.max), `${none} of ${GATE_HANDS} hands have no winner (at most ${GATE_NONE * 100} %)`);
		if (COMPARES.has(winnerRuleOf(g))) assert.ok(shared / GATE_HANDS <= GATE_SHARED, `${shared} of ${GATE_HANDS} hands have more than one winning side (at most ${GATE_SHARED * 100} %)`);
	});
}

// 3c. the same second ceiling for the games themselves (not variants): a game won by comparing points has several winning sides in
// at most half of 200 hands, at every number of seats (measured in revision 10: the most is Meno on seven seats, 38 %).
for (const c of ALL_CONFIGS.filter((x) => !x.variant && !x.options)) {
	test(`3c. ${c.label}: ${GATE_HANDS} hands, more than one winning side at most ${GATE_SHARED * 100} % where the winner is found by comparing points`, (t) => {
		if (NOT_PLAYED_YET.has(c.label)) return t.skip(NOT_PLAYED_YET.get(c.label));
		const g = gameOf(c);
		if (!COMPARES.has(winnerRuleOf(g))) return t.skip('the winner is not found by comparing points');
		let shared = 0;
		for (let i = 0; i < GATE_HANDS; i++) {
			const h = playHand(g, 'gate' + i, i % c.seats);
			const of = h.sides().of;
			if (new Set(h.result().winners.map((q) => of[q])).size > 1) shared++;
		}
		assert.ok(shared / GATE_HANDS <= GATE_SHARED, `${shared} of ${GATE_HANDS} hands have more than one winning side (at most ${GATE_SHARED * 100} %)`);
	});
}

// ---- 4. the declaration tables ----
for (const c of ALL_CONFIGS.filter((x) => !x.options)) {
	test(`4. ${c.label}: every declaration pays for each number of cards from min to the most a hand holds`, (t) => {
		let g;
		try { g = gameOf(c); } catch { return t.skip('does not load: judged by check 3'); }
		const entry = g.plan.find((e) => e.module === 'declarations');
		if (!entry) return t.skip('no declarations');
		const hb = handsBeforeTricks(g.rules, c.seats);
		const handSize = hb ? hb[0] : 78;
		const missing = [];
		for (const k of entry.set.kinds) {
			const pays = k.pays;
			if (!(pays && typeof pays === 'object' && 'table' in pays)) continue;
			const pred = compileSelector(k.of, g.env);
			const most = Math.min(DECK.filter((x) => pred(x)).length, handSize);
			for (let n = k.min; n <= most; n++) if (!kindAmount(k, n, g.options)) missing.push(`${k.id}: ${n}`);
		}
		assert.deepEqual(missing, [], 'no payment for: ' + missing.join(', '));
	});
}

test('every game file is covered by the configurations above', () => {
	assert.equal(gameIds().length, 21);
	for (const id of gameIds()) assert.ok(seatCounts(id).length > 0, id);
	assert.ok(ALL_CONFIGS.length > 100);
});
