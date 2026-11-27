// Meno with eight cards: a vola (every trick taken by one player) makes him the only winner and the others pay him
// (Torino [1846], part I, p. 32). Checked on hands built by hand, apart from the engine's own tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, loadWith, phaseOf, newH, deal, playOut } from './lib.mjs';

const TOP = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14'];
const LOW = ['swords:1', 'swords:2', 'swords:3', 'swords:4', 'swords:5', 'swords:6', 'swords:7', 'swords:8'];
const first = (hh, seat, legal) => legal[0];

function volaHand(n, g) {
	const wants = Array.from({ length: n }, (_, i) => (i === 0 ? TOP : i === 1 ? LOW : []));
	const p = deal(Array(n).fill(8), wants);
	const h = newH(g, 'vola' + n, 0, { preset: p });
	playOut(h, { pick: first });
	return h;
}

test('meno eight cards, two seats: all eight tricks to seat 0 make him the only winner; seat 1 pays him a stake', () => {
	const h = volaHand(2, load('meno', 2, { variant: 'eight_cards' }));
	const sn = h.snapshot();
	assert.equal(sn.tricks.length, 8);
	assert.ok(sn.tricks.every((t) => t.winner === 0));
	const r = h.result();
	assert.ok(r.points[0] > r.points[1], 'he holds the most points, as the old reading had it lose');
	assert.deepEqual(r.winners, [0]);
	assert.equal(r.outcome, 'win');
	assert.deepEqual(r.worst, [1]);
	assert.deepEqual(r.payments.map((p) => ({ from: p.from, to: p.to, amount: p.amount })), [{ from: 1, to: 0, amount: 1 }]);
});

test('meno eight cards, three seats: both others pay the player of the vola', () => {
	const h = volaHand(3, load('meno', 3, { variant: 'eight_cards' }));
	const r = h.result();
	assert.ok(h.snapshot().tricks.every((t) => t.winner === 0));
	assert.deepEqual(r.winners, [0]);
	assert.deepEqual(r.worst, [1, 2]);
	assert.deepEqual(r.payments.map((p) => ({ from: p.from, to: p.to })).sort((a, b) => a.from - b.from), [{ from: 1, to: 0 }, { from: 2, to: 0 }]);
});

test('the other reading (vola none) and the forms of four cards and of the base game keep the points', () => {
	const old = loadWith('meno', 2, (f) => {
		const v = f.variants.find((x) => x.id === 'eight_cards');
		phaseOf(v.patch, 'result').settings.vola.value = 'none';
	}, { variant: 'eight_cards' });
	const r = volaHand(2, old).result();
	assert.deepEqual(r.winners, [1], 'the points decide: the fewest wins');
	assert.deepEqual(r.payments.map((p) => ({ from: p.from, to: p.to })), [{ from: 0, to: 1 }]);
	assert.equal((load('meno', 2).plan.find((e) => e.module === 'result').set.vola), 'none');
	assert.equal((load('meno', 2, { variant: 'four_cards' }).plan.find((e) => e.module === 'result').set.vola), 'none');
});
