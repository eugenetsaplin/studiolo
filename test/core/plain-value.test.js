// Revision 14: a plain card counted singly is worth 1 at Sedici (two, three, four), at Trent'uno and in the short forms of Meno
// (Prammatica [1846], p. 12; Torino [1846], part I, pp. 30, 37). Master counted 0 in Sedici and in the form of four cards.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, livePoints, scene, playFirstTrick } from './race-helpers.js';
import { getFile } from './helpers.js';

const countSet = (g) => g.plan.find((x) => x.module === 'count').set;

test('a trick of two plain cards gives its taker two points at Sedici (two seats) and at Trent\'uno', () => {
	for (const id of ['sedici_2', 'trentuno']) {
		const g = load(id, 2);
		const h = scene(g, 'swords:5', 'swords:2');
		playFirstTrick(h, 'swords:5', 'swords:2');
		assert.equal(livePoints(h, 1), 2, `${id}: swords:5 and swords:2 are two plain cards, one point each`);
		assert.equal(livePoints(h, 0), 0);
	}
});

test('plain_value is 1, marked [R], with 0 as the other reading, in every file that counts singly', () => {
	const leaves = [];
	for (const id of ['sedici_2', 'sedici_3', 'sedici_4', 'trentuno']) {
		const ph = getFile(id).hand.phases.find((p) => p.id === 'count');
		leaves.push([id, ph.settings.plain_value]);
	}
	const meno = getFile('meno');
	for (const v of meno.variants) {
		const ph = v.patch.hand && v.patch.hand.phases.find((p) => p.id === 'count');
		if (ph && ph.settings.plain_value) leaves.push([`meno/${v.id}`, ph.settings.plain_value]);
	}
	assert.equal(leaves.length, 6, 'four games and two short forms of Meno');
	for (const [name, leaf] of leaves) {
		assert.equal(leaf.value, 1, name);
		assert.equal(leaf.alt, 0, name);
		assert.match(leaf.source, /^\[R\]/, name);
		assert.ok(!leaf.replace, `${name}: question 9 is closed by a document, no replace`);
		assert.match(leaf.source, /Prammatica \[1846\], p\. 12/, name);
	}
});

test('the engine counts 1 for a plain card at Sedici for three and four and in the form of four cards of Meno', () => {
	for (const [id, seats, extra] of [['sedici_3', 3, {}], ['sedici_4', 4, {}], ['meno', 2, { variant: 'four_cards' }], ['meno', 3, { variant: 'four_cards' }], ['meno', 2, { variant: 'eight_cards' }]]) {
		const g = load(id, seats, extra);
		assert.equal(countSet(g).group, 1, `${id}/${seats}`);
		assert.equal(countSet(g).plain_value, 1, `${id}/${seats}`);
	}
});
