// Revision 11, Meno with eight cards: all eight tricks to one seat (a vola) make him the only winner. The bot does not look
// for that outcome; it only has to judge and play to the end without breaking when it happens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { ctxOf } from '../../bots/policy.js';
import { rollout, scoreOf, marginOf } from '../../bots/rollout.js';
import { level } from './lib.mjs';
import { load, deal } from '../check-core/lib.mjs';

const TOP = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14'];
const LOW = ['swords:1', 'swords:2', 'swords:3', 'swords:4', 'swords:5', 'swords:6', 'swords:7', 'swords:8'];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// a deal where seat 0 holds the eight highest trumps and leads: every trick is his
function volaDeal(n) {
	const wants = Array.from({ length: n }, (_, i) => (i === 0 ? TOP : i === 1 ? LOW : []));
	return deal(Array(n).fill(8), wants);
}

for (const n of [2, 3]) {
	test(`meno eight cards, ${n} seats: bots play a hand that ends in a vola; every answer is legal and the scores are numbers`, () => {
		const g = load('meno', n, { variant: 'eight_cards' });
		const ctx = ctxOf(g);
		const h = newHand(g, { seed: 'volabot' + n, dealer: 0, preset: volaDeal(n) });
		for (let k = 0; !h.isOver(); k++) {
			assert.ok(k < 200);
			const q = h.toAct()[0];
			const v = h.view(q);
			const r = chooseAction({ game: g, view: v, level: level('normal'), seed: `v${n}:${k}` });
			assert.ok(v.legal.some((a) => same(a, r.action)));
			for (const e of r.eval) assert.ok(Number.isFinite(e.value), 'the evaluation is a number');
			// the seat 0 takes all the tricks whatever the bots do as long as it plays its top trumps: force that to reach the vola
			const mine = q === 0 ? v.legal.find((a) => a.type === 'play' && TOP.includes(a.card)) : null;
			assert.ok(h.apply(q, mine && v.tricks.length < 8 ? mine : r.action).ok);
		}
		const res = h.result();
		if (h.snapshot().tricks.every((t) => t.winner === 0)) assert.deepEqual(res.winners, [0], 'the player of the vola is the only winner');
		// the score of the finished hand, for every seat
		for (let seat = 0; seat < n; seat++) {
			const s = scoreOf(res, ctx, seat, level('normal'), h);
			assert.ok(Number.isFinite(s), `score of seat ${seat}`);
			assert.ok(Number.isFinite(marginOf(res, ctx, seat, h)));
		}
	});

	test(`meno eight cards, ${n} seats: a rollout from a position next to the vola ends with a result and finite scores`, () => {
		const g = load('meno', n, { variant: 'eight_cards' });
		const ctx = ctxOf(g);
		const h = newHand(g, { seed: 'volaroll' + n, dealer: 0, preset: volaDeal(n) });
		// two tricks are played to the vola's side, then every seat is played by the rollout policies
		for (let t = 0; t < 2 * n; t++) {
			const q = h.toAct()[0];
			const v = h.view(q);
			const pick = q === 0 ? v.legal.find((a) => a.type === 'play' && TOP.includes(a.card)) : v.legal[0];
			assert.ok(h.apply(q, pick || v.legal[0]).ok);
		}
		for (const mode of ['random', 'greedy']) {
			for (let i = 0; i < 20; i++) {
				const c = h.clone();
				const res = rollout(c, ctx, mode, makeRng(`volaroll${n}${mode}${i}`), { plays: 0 });
				assert.ok(res, 'a result');
				assert.ok(Array.isArray(res.winners));
				for (let seat = 0; seat < n; seat++) assert.ok(Number.isFinite(scoreOf(res, ctx, seat, level('normal'), c)));
			}
		}
	});
}

test('meno eight cards: bots of two levels play whole hands to the end', () => {
	for (const n of [2, 4]) {
		const g8 = load('meno', n, { variant: 'eight_cards' });
		
		for (let d = 0; d < 3; d++) {
			const h = newHand(g8, { seed: `m8${n}${d}`, dealer: d % n });
			for (let k = 0; !h.isOver(); k++) {
				assert.ok(k < 400);
				const q = h.toAct()[0];
				const r = chooseAction({ game: g8, view: h.view(q), level: level(k % 2 ? 'easy' : 'normal'), seed: `m${d}:${k}` });
				assert.ok(h.apply(q, r.action).ok);
			}
			assert.ok(h.result() && Array.isArray(h.result().winners));
		}
	}
});
