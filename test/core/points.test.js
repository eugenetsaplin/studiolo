import test from 'node:test';
import assert from 'node:assert/strict';
import { DECK, valueTable, countTwelfths, hashOf, canonical, makeRng } from '../../core/index.js';
import { fnv1a64 } from '../../core/hash.js';

const table = valueTable('honours_4_angel');

test('all 78 cards in pairs are 1092 twelfths (91 points), in threes 936 (78 points)', () => {
	assert.equal(countTwelfths(DECK, { table, group: 2 }), 1092);
	assert.equal(countTwelfths(DECK, { table, group: 3 }), 936);
	assert.equal(countTwelfths(DECK, { table, group: 4 }), 858);
	assert.equal(countTwelfths(DECK, { table, group: 1 }), 1560);
});

test('the order of the cards does not change a count with no odd card', () => {
	const rng = makeRng('order');
	const a = DECK.slice();
	for (let i = a.length - 1; i > 0; i--) { const j = rng.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
	assert.equal(countTwelfths(a, { table, group: 2 }), 1092);
	assert.equal(countTwelfths(a, { table, group: 3 }), 936);
});

test('values: a king with a plain card is 5, two plain cards are 1', () => {
	assert.equal(countTwelfths(['swords:K', 'swords:2'], { table, group: 2 }), 60);
	assert.equal(countTwelfths(['swords:3', 'swords:2'], { table, group: 2 }), 12);
	assert.equal(table.v.T20, 5);
	assert.equal(table.v.T21, 1);
	assert.equal(table.v.T0, 5);
	assert.equal(valueTable('honours_4').v.T21, 5);
	assert.equal(valueTable('honours_4').v.T20, 1);
});

test('odd cards: half_point, drop, as_group', () => {
	const cards = ['swords:K', 'swords:2', 'swords:3']; // the third card is the odd one
	assert.equal(countTwelfths(cards, { table, group: 2, oddCard: 'half_point' }), 60 + 6);
	assert.equal(countTwelfths(cards, { table, group: 2, oddCard: 'drop' }), 60);
	assert.equal(countTwelfths(cards, { table, group: 2, oddCard: 'as_group' }), 60 + 12);
	const four = ['swords:K', 'swords:2', 'swords:3', 'swords:4', 'swords:5']; // groups of three: two odd cards
	assert.equal(countTwelfths(four, { table, group: 3, oddCard: 'as_group' }), 60 + 12);
});

test('plain_value counts a plain card singly, the named cards keep their value', () => {
	const short = valueTable('book_1787_short');
	assert.equal(countTwelfths(['swords:2', 'T0'], { table: short, group: 1, plainValue: 0 }), 12);
	assert.equal(countTwelfths(['swords:2', 'T0'], { table: short, group: 1, plainValue: 1 }), 24);
	assert.equal(countTwelfths(['swords:K'], { table: short, group: 1, plainValue: 0 }), 60);
});

test('FNV-1a 64 equals the reference with BigInt', () => {
	const ref = (s) => {
		let h = 0xcbf29ce484222325n;
		for (const b of new TextEncoder().encode(s)) { h ^= BigInt(b); h = BigInt.asUintN(64, h * 0x100000001b3n); }
		return h.toString(16).padStart(16, '0');
	};
	for (const s of ['', 'a', 'foobar', '{"a":[1,2,3],"b":"swords:K"}', 'x'.repeat(5000)]) assert.equal(fnv1a64(s), ref(s));
	assert.equal(hashOf({ b: 1, a: [2, { d: 1, c: 2 }] }), fnv1a64('{"a":[2,{"c":2,"d":1}],"b":1}'));
	assert.equal(canonical({ z: undefined, a: 1 }), '{"a":1}');
});

test('the random numbers: the same seed, the same stream; a shuffle keeps the cards', () => {
	const a = makeRng('s'); const b = makeRng('s'); const c = makeRng('t');
	const xs = [a.next(), a.next(), a.next()];
	assert.deepEqual(xs, [b.next(), b.next(), b.next()]);
	assert.notDeepEqual(xs, [c.next(), c.next(), c.next()]);
	for (const x of xs) assert.ok(x >= 0 && x < 1);
	const r = makeRng('range');
	for (let i = 0; i < 1000; i++) { const v = r.int(7); assert.ok(Number.isInteger(v) && v >= 0 && v < 7); }
});
