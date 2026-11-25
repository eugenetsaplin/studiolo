// The robots play the games with declarations and a second deal, and the secrecy check shuffles what a seat cannot see.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, newHand, makeRng } from '../../core/index.js';
import { getFile, runCase, swapUnseen, biased, robotAction } from '../../tools/robots.mjs';

const jstr = (x) => JSON.stringify(x);

test('the pairs with declarations and a second deal are played to the end: 0 failures, secrecy watched', () => {
	for (const [id, seats] of [['mitigati_2', 2], ['bagattultimo', 3]]) {
		const row = runCase({ id, seats, deals: 30, seed: 'k3-robots', secrecy: 30 });
		assert.equal(row.error, null, row.error);
		assert.equal(row.hands, 30);
		assert.deepEqual(Object.values(row.fail).reduce((a, b) => a + b, 0), 0, jstr(row.samples.slice(0, 2)));
	}
});

test('swapUnseen changes the hands of the others and leaves the view of the seat as it was', () => {
	const game = loadGame('bagattultimo', getFile, { seats: 3 });
	const h = newHand(game, { seed: 'k3-swap', dealer: 1 });
	const rng = makeRng('k3-swap-bot');
	for (let i = 0; i < 12 && !h.isOver(); i++) {
		const seat = h.toAct()[0];
		h.apply(seat, robotAction(h, seat, h.legal(seat), rng, 0));
	}
	for (let q = 0; q < 3; q++) {
		const alt = swapUnseen(h, q, makeRng('k3-alt-' + q));
		assert.equal(jstr(alt.view(q)), jstr(h.view(q)));
		assert.deepEqual(alt.s.hands[q], h.s.hands[q], 'the own hand does not move');
		assert.notDeepEqual(alt.s.hands.filter((_, r) => r !== q), h.s.hands.filter((_, r) => r !== q), 'the other hands do');
		assert.deepEqual(alt.s.hands.map((l) => l.length), h.s.hands.map((l) => l.length));
	}
});

test('the robot offers a declaration, a bid or lay_done now and then, never an empty list', () => {
	const rng = makeRng('k3-bias');
	const legal = [{ type: 'declare_onori' }, { type: 'declare_done' }];
	const picks = new Set();
	for (let i = 0; i < 60; i++) for (const a of biased(legal, rng)) picks.add(a.type);
	assert.ok(picks.has('declare_onori') && picks.has('declare_done'));
	assert.deepEqual(biased([{ type: 'play', card: 'T1' }], rng), [{ type: 'play', card: 'T1' }]);
	const bids = [{ type: 'bid_a' }, { type: 'pass' }];
	assert.ok(Array.from({ length: 40 }, () => biased(bids, rng).length).includes(1));
});
