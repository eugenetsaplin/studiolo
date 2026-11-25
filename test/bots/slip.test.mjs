// The optional level key `slip`: the chance that a greedy rollout player plays a random legal card (default SLIP).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction, parseLevel } from '../../bots/index.js';
import { SLIP } from '../../bots/rollout.js';
import { game, level } from './lib.mjs';

const small = { ...level('normal'), worlds: 12, budget_plays: 8000, noise: 0 };

// views of a seat with a choice of cards, met while random cards are played
function cardViews(g, seed, max) {
	const out = [];
	for (let d = 0; out.length < max && d < 40; d++) {
		const h = newHand(g, { seed: `${seed}${d}`, dealer: d % g.seats });
		const rng = makeRng(`${seed}r${d}`);
		while (!h.isOver() && out.length < max) {
			const q = h.toAct()[0];
			const v = h.view(q);
			const legal = h.legal(q);
			if (legal.filter((a) => a.type === 'play').length > 1) out.push(v);
			h.apply(q, legal[rng.int(legal.length)]);
		}
	}
	return out;
}

test('slip: optional, checked, absent in the shipped levels', () => {
	const base = level('normal');
	assert.equal(base.slip, undefined);
	assert.equal(parseLevel({ ...base, slip: 0.1 }).slip, 0.1);
	assert.throws(() => parseLevel({ ...base, slip: -0.1 }), /slip/);
	assert.throws(() => parseLevel({ ...base, slip: 1.5 }), /slip/);
	assert.throws(() => parseLevel({ ...base, slip: 'x' }), /slip/);
	assert.equal(level('easy').slip, undefined);
});

test('slip: the default plays as before; another value changes the search', () => {
	const g = game('venticinque', 2);
	const views = cardViews(g, 'slip', 12);
	assert.ok(views.length >= 8);
	let differ = 0;
	for (const [i, v] of views.entries()) {
		const a = chooseAction({ game: g, view: v, level: small, seed: 's' + i });
		const b = chooseAction({ game: g, view: v, level: { ...small, slip: SLIP }, seed: 's' + i });
		assert.deepEqual(b, a);
		const c = chooseAction({ game: g, view: v, level: { ...small, slip: 0 }, seed: 's' + i });
		assert.ok(v.legal.some((x) => JSON.stringify(x) === JSON.stringify(c.action)));
		if (JSON.stringify(c.eval) !== JSON.stringify(a.eval)) differ++;
	}
	assert.ok(differ > 0);
});
