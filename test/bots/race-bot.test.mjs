import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng, loadGame } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { prepare, sampleWorld } from '../../bots/worlds.js';
import { TWO_SEAT_RACE, game, level, same, walk } from './race-lib.mjs';
import { getFile } from './lib.mjs';

const easy = level('easy');
const ask = (g, v, seed = 's', lv = easy) => chooseAction({ game: g, view: v, level: lv, seed });
const noClaim = (l) => l.filter((a) => a.type !== 'claim_fuora');

test('every answer is in view.legal (2000 random decisions per game)', () => {
	for (const [id, seats] of TWO_SEAT_RACE) {
		const g = game(id, seats);
		let n = 0;
		walk(g, 'legal' + id, 2000, (h, q) => {
			const v = h.view(q);
			const r = ask(g, v, 'x' + n++);
			assert.ok(v.legal.some((a) => same(a, r.action)), `${id}: ${JSON.stringify(r.action)} not legal`);
		});
		assert.equal(n, 2000);
	}
});

test('determinism: the same input twice, and from a clone of the hand', () => {
	for (const [id, seats] of TWO_SEAT_RACE) {
		const g = game(id, seats);
		let n = 0;
		walk(g, 'det' + id, 12, (h, q) => {
			const a = ask(g, h.view(q), 'd' + n, level('normal'));
			assert.deepEqual(a, ask(g, h.view(q), 'd' + n, level('normal')));
			assert.deepEqual(a, ask(g, h.clone().view(q), 'd' + n, level('normal')));
			n++;
		}, 5);
	}
});

test('the rebuilt world shows the seat what the real hand shows (200 positions per game)', () => {
	for (const [id, seats] of TWO_SEAT_RACE) {
		const g = game(id, seats);
		let n = 0;
		let built = 0;
		walk(g, 'world' + id, 200, (h, q) => {
			const v = h.view(q);
			n++;
			if (v.legal.every((a) => a.type === 'claim_fuora')) { built++; return; } // a claim-only window: nothing to sample
			if (v.legal.some((a) => a.type === 'fool_give')) { built++; return; } // the end-of-hand Fool card: not sampled
			const info = prepare(g, v);
			assert.ok(info.ok, `${id}: prepare ${info.why}`);
			const w = sampleWorld(g, v, info, easy, makeRng, 'w', n);
			if (!w) return;
			built++;
			const u = w.hand.view(q);
			assert.deepEqual(u.hand, v.hand);
			assert.deepEqual(noClaim(u.legal), noClaim(v.legal));
			assert.deepEqual(u.tricks, v.tricks);
			assert.deepEqual(u.trick, v.trick);
			assert.deepEqual(u.round, v.round);
			assert.deepEqual(u.open_piles, v.open_piles);
			assert.deepEqual(u.handCounts, v.handCounts);
		});
		assert.equal(n, 200);
		assert.ok(built >= n * 0.85, `${id}: only ${built} of ${n} worlds built`);
	}
});

test('claim_fuora: never below the target, always at it', () => {
	for (const [id, seats] of [['sedici_2', 2], ['trentuno', 2]]) {
		const g = game(id, seats);
		let offered = 0;
		walk(g, 'claim' + id, 600, (h, q) => {
			const v = h.view(q);
			if (!v.legal.some((a) => a.type === 'claim_fuora')) return;
			offered++;
			const out = v.points.mine >= v.fuora.target;
			assert.equal(ask(g, v).action.type === 'claim_fuora', out, `${id}: ${v.points.mine} of ${v.fuora.target}`);
			// without view.points the bot counts the cards it won and gets the same answer
			const bare = { ...v };
			delete bare.points;
			assert.equal(ask(g, bare).action.type === 'claim_fuora', out);
			// exactly at the target, and one point below
			assert.equal(ask(g, { ...v, points: { mine: v.fuora.target } }).action.type, 'claim_fuora');
			if (v.legal.some((a) => a.type === 'play')) assert.notEqual(ask(g, { ...v, points: { mine: v.fuora.target - 1 } }).action.type, 'claim_fuora');
		});
		assert.ok(offered > 0, `${id}: a claim was never offered`);
	}
});

test('a partita between two bots ends in a true fuora, never a false one', () => {
	for (const id of ['sedici_2', 'trentuno']) {
		const g = game(id, 2);
		for (let d = 0; d < 3; d++) {
			const h = newHand(g, { seed: 'win' + d, dealer: d % 2 });
			let k = 0;
			while (!h.isOver()) {
				const q = h.toAct()[0];
				assert.ok(h.apply(q, ask(g, h.view(q), 'w' + d + k++).action).ok);
			}
			assert.ok(h.result().reason === 'fuora' || h.result().reason === 'stock_empty');
			assert.equal(h.result().payments.some((p) => p.why === 'false_claim'), false);
		}
	}
});

// revision 9: the file plays the Fool in place of a card; showing it on one's own turn is the alt cards.fool_show_any_time
test('show_fool is answered at once when offered', () => {
	const g = loadGame('baronetti', getFile, { seats: 2, alts: ['cards.fool_show_any_time'] });
	let shows = 0;
	walk(g, 'show', 1200, (h, q) => {
		const v = h.view(q);
		if (!v.legal.some((a) => a.type === 'show_fool')) return;
		assert.equal(ask(g, v).action.type, 'show_fool');
		shows++;
	});
	assert.ok(shows > 0, 'no Fool was ever offered');
});

// two deals that look the same to the seat: covered pile cards swapped, stock order swapped, the other hand swapped
test('view only: hidden cards swapped, the same answer and the same eval', () => {
	const lv = level('normal');
	{ // Baronetti: the bottom (covered) cards of piles of both seats are swapped
		const g = game('baronetti', 2);
		const base = newHand(g, { seed: 'twin', dealer: 0 });
		const mk = (swap) => {
			const out = {};
			for (let q = 0; q < 2; q++) out[q] = base.s.piles[q].map((p) => p.cards.slice());
			if (swap) {
				[out[0][0][0], out[1][1][0]] = [out[1][1][0], out[0][0][0]];
				[out[0][2][1], out[0][3][1]] = [out[0][3][1], out[0][2][1]];
			}
			return newHand(g, { seed: 'twin', dealer: 0, preset: { piles: out, rest: [] } });
		};
		const a = mk(false);
		const b = mk(true);
		const q = a.toAct()[0];
		assert.deepEqual(a.view(q), b.view(q));
		assert.deepEqual(ask(g, a.view(q), 't', lv), ask(g, b.view(q), 't', lv));
	}
	for (const id of ['sedici_2', 'trentuno']) { // the other hand and the order of the stock
		const g = game(id, 2);
		const base = newHand(g, { seed: 'twin' + id, dealer: 0 });
		const me = base.toAct()[0];
		const opp = 1 - me;
		const mk = (swap) => {
			const hs = { 0: base.s.hands[0].slice(), 1: base.s.hands[1].slice() };
			const r = base.s.rest.slice();
			if (swap) {
				[hs[opp][0], r[3]] = [r[3], hs[opp][0]];
				[r[10], r[20]] = [r[20], r[10]];
			}
			return newHand(g, { seed: 'twin' + id, dealer: 0, preset: { hands: hs, rest: r } });
		};
		const a = mk(false);
		const b = mk(true);
		assert.deepEqual(a.view(me), b.view(me));
		assert.deepEqual(ask(g, a.view(me), 't', lv), ask(g, b.view(me), 't', lv), id);
	}
});
