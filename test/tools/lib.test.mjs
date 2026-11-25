// test/lib: secrecy.mjs and invariants.mjs on hand-made snapshots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaks, secretFor } from '../lib/secrecy.mjs';
import { conservation, recount } from '../lib/invariants.mjs';
import { deck78, sortCanonical } from '../lib/deck.mjs';

test('the deck: 78 distinct ids in canonical order', () => {
	const d = deck78();
	assert.equal(d.length, 78);
	assert.equal(new Set(d).size, 78);
	assert.deepEqual([d[0], d[13], d[14], d[55], d[56], d[76], d[77]], ['swords:1', 'swords:K', 'batons:1', 'coins:K', 'T1', 'T21', 'T0']);
	assert.deepEqual(sortCanonical(['T0', 'coins:1', 'T5', 'swords:K']), ['swords:K', 'coins:1', 'T5', 'T0']);
});

const snap = () => ({
	hands: { 0: ['swords:1', 'T5'], 1: ['cups:K', 'T7'] },
	discard: { 0: ['coins:2'], 1: ['coins:3'] },
	rest: ['batons:9'],
	stock: ['T9', 'T10'],
	won: { 0: ['T20'], 1: [] },
	trick: [{ seat: 0, card: 'T1' }],
});

test('secrecy: the seat sees its own hand and discard, nothing else', () => {
	const s = snap();
	assert.deepEqual(leaks(s, [], 0, { hand: ['swords:1', 'T5'], discard: { mine: ['coins:2'] } }), []);
	assert.deepEqual(leaks(s, [], 0, { hand: ['swords:1'], other: 'cups:K' }), ['cups:K']);
});

test('secrecy: every string value and key at any depth, in canonical order', () => {
	const s = snap();
	const msg = { a: [{ b: { c: 'the card T7 is held' } }], 'coins:3': 1, deep: [[['T9']], 'batons:9'], n: 5 };
	assert.deepEqual(leaks(s, [], 0, msg), ['batons:9', 'coins:3', 'T7', 'T9']);
	assert.deepEqual(leaks(s, [], 0, JSON.stringify(msg)), ['batons:9', 'coins:3', 'T7', 'T9']);
});

test('secrecy: the rest, the stock and others\' discards leak; public cards do not', () => {
	const s = snap();
	assert.deepEqual(leaks(s, [], 1, { x: ['coins:2', 'T9', 'T10', 'batons:9'] }), ['batons:9', 'coins:2', 'T9', 'T10']);
	assert.deepEqual(leaks(s, ['T9', 'coins:2'], 1, { x: ['coins:2', 'T9', 'T10', 'batons:9'] }), ['batons:9', 'T10']);
	assert.deepEqual(leaks(s, new Set(['T7']), 0, { y: 'T7' }), []);
});

test('secrecy: T1 does not match inside T10 or T21', () => {
	const s = snap();
	assert.deepEqual(leaks(s, [], 0, { t: 'T10' }), ['T10']);
	assert.deepEqual(secretFor(s, 0).has('T1'), false);
	assert.deepEqual(leaks(s, [], 1, { t: 'T21 T2' }), []);
});

test('conservation: a whole deck passes; a missing, doubled or foreign card is named', () => {
	const d = deck78();
	const ok = { hands: { 0: d.slice(0, 20), 1: d.slice(20, 40) }, discard: { 0: d.slice(40, 43) }, rest: d.slice(43, 50), stock: d.slice(50, 60), won: { 0: d.slice(60, 77) }, trick: [{ seat: 1, card: d[77] }] };
	assert.deepEqual(conservation(ok), []);
	const bad = structuredClone(ok);
	bad.hands[0][0] = d[1];
	bad.rest.push('T99');
	const p = conservation(bad);
	assert.ok(p.some(x => x.startsWith('swords:1: missing')), p.join('\n'));
	assert.ok(p.some(x => x.startsWith('swords:2: 2 times')), p.join('\n'));
	assert.ok(p.some(x => x.startsWith('T99: not a card')), p.join('\n'));
	assert.deepEqual(conservation({ hands: { 0: ['a', 'b'] } }, ['a', 'b']), []);
});

const ALL = deck78();
const PRESETS = ['honours_4_angel', 'honours_4', 'book_1787_short'];

test('recount: all 78 cards in pairs = 1092 twelfths (91 points), in threes = 936 (78 points)', () => {
	for (const cardPoints of ['honours_4_angel', 'honours_4']) {
		assert.equal(recount({ 0: ALL }, { cardPoints, group: 2 })[0], 1092, cardPoints);
		assert.equal(recount({ 0: ALL }, { cardPoints, group: 3 })[0], 936, cardPoints);
		assert.equal(recount({ 0: ALL }, { cardPoints, group: 1 })[0], 130 * 12, cardPoints);
		assert.equal(recount({ 0: ALL }, { cardPoints, group: 4 })[0], 130 * 12 - 12 * 3 * 19 - 9 * 2, cardPoints);
	}
});

test('recount: the same total however the deck is split between seats', () => {
	const a = ALL.slice(0, 40), b = ALL.slice(40);
	for (const oddCard of ['half_point']) {
		const r = recount({ 0: a, 1: b }, { cardPoints: 'honours_4_angel', group: 2, oddCard });
		assert.equal(r[0] + r[1], 1092);
	}
	const odd = recount({ 0: ALL.slice(0, 39), 1: ALL.slice(39) }, { cardPoints: 'honours_4_angel', group: 2, oddCard: 'half_point' });
	assert.equal(odd[0] + odd[1], 1092);
});

test('recount: the presets differ where the book says', () => {
	assert.equal(recount({ 0: ['T0'] }, { cardPoints: 'honours_4_angel', group: 1 })[0], 60);
	assert.equal(recount({ 0: ['T0'] }, { cardPoints: 'honours_4', group: 1 })[0], 60);
	assert.equal(recount({ 0: ['T0'] }, { cardPoints: 'book_1787_short', group: 1 })[0], 12);
	assert.equal(recount({ 0: ['T20'] }, { cardPoints: 'honours_4_angel', group: 1 })[0], 60);
	assert.equal(recount({ 0: ['T20'] }, { cardPoints: 'honours_4', group: 1 })[0], 12);
	assert.equal(recount({ 0: ['T21'] }, { cardPoints: 'honours_4', group: 1 })[0], 60);
	assert.equal(recount({ 0: ['T21'] }, { cardPoints: 'honours_4_angel', group: 1 })[0], 12);
	assert.equal(recount({ 0: ['T1'] }, { cardPoints: 'book_1787_short', group: 1 })[0], 60);
	assert.equal(recount({ 0: ['cups:3'] }, { cardPoints: 'book_1787_short', group: 1, plainValue: 0 })[0], 0);
	assert.equal(recount({ 0: ['cups:3'] }, { cardPoints: 'book_1787_short', group: 1, plainValue: 1 })[0], 12);
	// the whole deck singly: 67 for the honours and the Fool, 59 plain cards
	assert.equal(recount({ 0: ALL }, { cardPoints: 'book_1787_short', group: 1, plainValue: 0 })[0], 67 * 12);
	assert.equal(recount({ 0: ALL }, { cardPoints: 'book_1787_short', group: 1, plainValue: 1 })[0], 126 * 12);
	assert.ok(PRESETS.length === 3);
});

test('recount: a king with a plain card is 5 points; the odd card follows odd_card', () => {
	const two = ['swords:K', 'cups:3'];
	assert.equal(recount({ 0: two }, { cardPoints: 'honours_4_angel' })[0], 60);
	const three = [...two, 'coins:9'];
	assert.equal(recount({ 0: three }, { cardPoints: 'honours_4_angel', oddCard: 'half_point' })[0], 60 + 6);
	assert.equal(recount({ 0: three }, { cardPoints: 'honours_4_angel', oddCard: 'drop' })[0], 60);
	assert.equal(recount({ 0: three }, { cardPoints: 'honours_4_angel', oddCard: 'as_group' })[0], 72);
	assert.equal(recount({ 0: ['swords:K'] }, { cardPoints: 'honours_4_angel', oddCard: 'half_point' })[0], 54);
});

test('recount: an explicit table', () => {
	const t = { 'rank:K': 5, T1: 5 };
	assert.equal(recount({ 0: ['cups:K', 'T1', 'T2', 'T3'] }, { cardPoints: t, group: 1 })[0], (5 + 5 + 1 + 1) * 12);
});
