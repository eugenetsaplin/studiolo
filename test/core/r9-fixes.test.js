// Revision 9: the five repairs of the core, each with a test that fails without it.
//   a1 call_partner: a rank is whole when the hand, as it stands after the discard, holds all four
//   a2 count: the keeper of a discard is found by side, not by seat
//   a3 points: with odd_card drop the cheapest cards are dropped, in whatever order the pile was collected
//   a4 fuora: with after_false_claim hand_ends a false claim costs the row and loses the hand at any number of seats
//   a9 support: a deal whose hands are unequal when the tricks start is refused
import test from 'node:test';
import assert from 'node:assert/strict';
import { callableCards } from '../../core/modules/call_partner.js';
import { keeperOf } from '../../core/modules/count.js';
import { valueTable, countTwelfths, newHand, makeRng } from '../../core/index.js';
import { handsBeforeTricks } from '../../core/support.js';
import { load, loadPatched } from './helpers.js';
import { playOut } from './race-helpers.js';

const KINGS = ['swords:K', 'batons:K', 'cups:K', 'coins:K'];

// ---- a1 ----
test('a1: a King put away does not make the Kings whole; four Kings left in hand send the caller to the Queens', () => {
	const entry = { set: { ladder: ['K', 'Q', 'N', 'J'], own_card: 'plays_alone_unless_forgiven' } };
	// three Kings in hand and the fourth in the discard: the Kings are still called (his own discard is never offered)
	let h = { s: { hands: [['swords:K', 'batons:K', 'cups:K', 'swords:2'], [], [], []], discard: [['coins:K', 'swords:3'], [], [], []] } };
	assert.deepEqual(callableCards(h, entry, 0).sort(), ['batons:K', 'cups:K', 'swords:K']);
	// all four Kings in hand after the discard: the Queens
	h = { s: { hands: [[...KINGS, 'swords:2'], [], [], []], discard: [['swords:3'], [], [], []] } };
	assert.deepEqual(callableCards(h, entry, 0).sort(), ['batons:Q', 'coins:Q', 'cups:Q', 'swords:Q']);
});

// ---- a2 ----
test('a2: the discard of a seat counts for it when a seat of its side took a trick', () => {
	// sides 0 and 2 against 1 and 3; seat 2, the partner of seat 0, took the only trick of the side, seat 1 the last one
	const h = {
		s: { tricks: [{ winner: 2 }, { winner: 1 }], dealer: 3, m: { discards: [] } },
		sides: () => ({ of: [0, 1, 0, 1] }),
	};
	const rec = { seat: 0, counts_for: 'discarder_unless_no_tricks' };
	assert.equal(keeperOf(h, rec, undefined), 0, 'the partner took a trick: the discard stays with its maker');
	h.s.tricks = [{ winner: 1 }, { winner: 3 }];
	assert.equal(keeperOf(h, rec, undefined), 3, 'the side took nothing: the discard goes to the taker of the last trick');
});

// ---- a3 ----
test('a3: odd_card drop throws away the cheapest cards, whatever the order of the pile', () => {
	const table = valueTable('honours_4_angel');
	const o = { table, group: 2, oddCard: 'drop' };
	// a King, a two and a three: the three (or the two) goes, the King stays: 5 + 1 - 1 = 5 points
	const a = countTwelfths(['swords:K', 'swords:2', 'swords:3'], o);
	const b = countTwelfths(['swords:2', 'swords:3', 'swords:K'], o);
	const c = countTwelfths(['swords:3', 'swords:K', 'swords:2'], o);
	assert.equal(a, 60);
	assert.equal(b, 60);
	assert.equal(c, 60);
	// three honours, groups of two: the cheapest honour goes (a Knave is worth 2 against a Queen's 4)
	const d = countTwelfths(['swords:K', 'swords:Q', 'swords:J'], { table, group: 2, oddCard: 'drop' });
	const e = countTwelfths(['swords:J', 'swords:Q', 'swords:K'], { table, group: 2, oddCard: 'drop' });
	assert.equal(d, e);
	assert.equal(d, countTwelfths(['swords:K', 'swords:Q'], { table, group: 2 }));
	// groups of four with five cards: one card dropped, the cheapest
	const five = ['swords:K', 'swords:Q', 'swords:N', 'swords:J', 'swords:2'];
	assert.equal(countTwelfths(five, { table, group: 4, oddCard: 'drop' }), countTwelfths(five.slice(0, 4), { table, group: 4 }));
	assert.equal(countTwelfths(five.slice().reverse(), { table, group: 4, oddCard: 'drop' }), countTwelfths(five.slice(0, 4), { table, group: 4 }));
});

// ---- a4 ----
const falseClaimHand = (id, seats) => {
	const game = load(id, seats, { alts: ['hand.phases[fuora].settings.after_false_claim'] });
	assert.equal(game.hooks.tricks.find((e) => e.module === 'fuora').set.after_false_claim, 'hand_ends');
	const h = newHand(game, { seed: 'r9-a4', dealer: 0 });
	return playOut(h, makeRng('r9-a4'), () => true); // claims the first time the table allows it: always too early
};
for (const [id, seats] of [['sedici_2', 2], ['sedici_3', 3], ['sedici_4', 4], ['trentuno', 2], ['trentuno', 3], ['trentuno', 4]]) {
	test(`a4: ${id}/${seats}, after_false_claim hand_ends: the false claim loses the hand for the claimer and costs him the row`, () => {
		const h = falseClaimHand(id, seats);
		const f = h.s.m.fuora;
		assert.ok(f.ended, 'the hand ended by a false claim');
		const claimer = f.ended.seat;
		const res = h.result();
		assert.equal(res.reason, 'false_claim');
		assert.deepEqual(res.winners, [...Array(seats).keys()].filter((q) => q !== claimer), 'every other seat wins');
		const paid = res.payments.filter((p) => p.why === 'false_claim');
		assert.equal(paid.length, seats - 1, 'the claimer pays each other seat');
		assert.ok(paid.every((p) => p.from === claimer && p.amount > 0));
		assert.equal(res.payments.length, seats - 1, 'the lost game is the row itself: no second payment');
		for (let q = 0; q < seats; q++) assert.equal(res.gamePoints[q], q === claimer ? 0 : 1);
	});
}

// ---- a9 ----
test('a9: a deal whose hands are unequal when the tricks start is refused at the start', () => {
	const real = load('mitigati_2', 2);
	assert.equal(real.support.runnable, true);
	assert.deepEqual(handsBeforeTricks(real.rules, 2), [25, 25]);
	const g = loadPatched('mitigati_2', 2, (f) => { f.hand.phases.find((p) => p.id === 'deal_first').settings.hand_size.value = 39; });
	assert.equal(g.support.runnable, false);
	assert.ok(g.support.missing.some((m) => /not equal/.test(m.why)), JSON.stringify(g.support.missing));
	assert.throws(() => newHand(g, { seed: 'x', dealer: 0 }));
});
