// Revision 14, the count by threes: a lone card loses one point (Torino 1880, p. 8: «'L Fol a val quatr pont da chiel sol»),
// so a lone Fool and the two other cards of the pack make one group and the pack counts 78 points.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../core/index.js';
import { load, newH } from './lib.mjs';
import { countTwelfths, valueTable } from '../../core/points.js';

// the policy of the checks: seeded, never an a monte proposal, the first card offered for the Fool
function play(h, seed, onAction) {
	const rng = makeRng('v1:' + seed);
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 4000) throw new Error('the hand does not end');
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const ok = legal.filter((a) => a.type !== 'a_monte_propose');
		const pool = ok.length ? ok : legal;
		const a = legal[0].type === 'fool_give' ? legal[0] : pool[rng.int(pool.length)];
		const r = h.apply(seat, a);
		assert.ok(r.ok, 'refused ' + JSON.stringify(a));
		if (onAction) onAction(h, seat, a, r);
	}
	return h;
}

const TABLE = valueTable('book_1787');
const THREES = { table: TABLE, group: 3, oddCard: 'as_group' };

test('counted by threes a lone card loses one point, a pair loses one, and a lone card with a pair is one group', () => {
	assert.equal(countTwelfths(['T0'], THREES), 4 * 12, 'the lone Fool is worth four points');
	assert.equal(countTwelfths(['swords:2'], THREES), 12 * 1 - 12, 'a lone plain card is worth nothing');
	assert.equal(countTwelfths(['swords:2', 'swords:3'], THREES), 12 * 2 - 12);
	// the pack in two heaps: the Fool alone against the other 77 cards makes 78 points
	const rest = ['T0'];
	const other = [];
	for (const s of ['swords', 'cups', 'coins', 'batons']) { for (const r of ['K', 'Q', 'N', 'J', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) other.push(`${s}:${r}`); }
	for (let t = 1; t <= 21; t++) other.push('T' + t);
	const all = [...rest, ...other];
	assert.equal(all.length, 78);
	assert.equal(countTwelfths(rest, THREES) + countTwelfths(other, THREES), 78 * 12);
	// the old way (a lone card loses nothing) made 79
	assert.equal(countTwelfths(rest, { ...THREES, group: 2 }), 5 * 12, 'pairs: a lone card loses nothing (not changed)');
	// fours: a lone card still loses nothing, three cards lose two points (not changed)
	assert.equal(countTwelfths(['swords:2'], { table: TABLE, group: 4, oddCard: 'as_group' }), 12);
	assert.equal(countTwelfths(['swords:2', 'swords:3', 'swords:4'], { table: TABLE, group: 4, oddCard: 'as_group' }), 36 - 24);
});

// the hands of the Fool's owner without a trick: found by a seeded random play (the seeds are the ones that made 79 before)
// the seeded play of these hands: the first seat to act, a seeded card among the legal ones (not an a monte proposal)
const BAGATT = load('bagattultimo', 3);
function seededHand(i) {
	const g = BAGATT;
	const h = newH(g, `b5-${i}`, i % 3);
	const rng = makeRng(`v1:b5${i}`);
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const ok = legal.filter((a) => a.type !== 'a_monte_propose');
		const pool = ok.length ? ok : legal;
		assert.ok(h.apply(seat, pool[rng.int(pool.length)]).ok);
	}
	return h;
}

// hands 874 and 1756 of this play are the ones where the owner of the Fool won no trick: the pack made 79 before
for (const i of [874, 1756]) {
	test(`bagattultimo: the owner of the Fool without a trick, the pack counts 78 points (hand ${i})`, () => {
		const h = seededHand(i);
		const sn = h.snapshot();
		assert.equal(sn.foolGive, null, 'no card was given for the Fool');
		assert.ok(Object.values(sn.won).some((w) => w.length === 1 && w[0] === 'T0'), 'the Fool lies alone');
		const sum = Object.values(h.result().points).reduce((a, b) => a + b, 0);
		assert.equal(sum, 78 * 12);
	});
}

test('bagattultimo: 2000 random hands, the points of the three always make 78', () => {
	for (let i = 0; i < 2000; i++) {
		const h = seededHand(i);
		const res = h.result();
		if (res.outcome === 'thrown_in') continue;
		assert.equal(Object.values(res.points).reduce((a, b) => a + b, 0), 78 * 12, `hand ${i}`);
	}
});
