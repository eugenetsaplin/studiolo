// 2000 random hands of every case: cards are conserved after every action, the replay gives the same checksum,
// a refused action changes nothing, a view never holds what the seat may not see, the same seed gives the same hand.
import test from 'node:test';
import assert from 'node:assert/strict';
import { replayHand, newHand } from '../../core/index.js';
import { CASES, load, playRandom, checkConserved } from './helpers.js';

const HANDS = 2000;

for (const [id, seats] of CASES) {
	test(`${id} at ${seats} seats: ${HANDS} random hands, cards conserved, replay equal`, () => {
		const game = load(id, seats);
		assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
		let actions = 0;
		for (let i = 0; i < HANDS; i++) {
			const dealer = i % seats;
			const h = playRandom(game, `t${i}`, dealer, (hh) => { checkConserved(hh); actions++; });
			checkConserved(h);
			assert.ok(h.result(), 'a hand that is over has a result');
			const back = replayHand(game, { seed: `t${i}`, dealer }, h.log);
			assert.equal(back.checksum(), h.checksum());
		}
		assert.ok(actions > HANDS * 10);
	});
}

test('a refused action leaves the checksum unchanged', () => {
	for (const [id, seats] of CASES) {
		const game = load(id, seats);
		playRandom(game, 'refuse', 0, (h, seat) => {
			const other = (seat + 1) % seats;
			for (const bad of [
				[other, { type: 'play', card: 'T1' }], [seat, { type: 'play', card: 'nonsense' }], [seat, null], [seat, { type: 'next' }],
				[seat, { type: 'discard', card: 'T0', extra: 1 }], [99, { type: 'play', card: 'T5' }], [-1, { type: 'a_monte_propose' }],
			]) {
				if (bad[0] === seat && bad[1] && bad[1].type === 'discard' && h.legal(seat).some((a) => a.card === 'T0' && a.type === 'discard')) continue;
				const before = h.checksum();
				const logLen = h.log.length;
				const r = h.apply(bad[0], bad[1]);
				if (r.ok) return; // it happened to be legal: the hand moved on, nothing to compare
				assert.equal(typeof r.code, 'string');
				assert.equal(h.checksum(), before);
				assert.equal(h.log.length, logLen);
			}
		});
	}
});

test('determinism: the same seed gives the same hand, another seed another', () => {
	for (const [id, seats] of CASES) {
		const game = load(id, seats);
		const a = playRandom(game, 'same', 1 % seats, null);
		const b = playRandom(game, 'same', 1 % seats, null);
		const c = playRandom(game, 'other', 1 % seats, null);
		assert.equal(a.checksum(), b.checksum());
		assert.notEqual(a.checksum(), c.checksum());
	}
});

test('clone is independent', () => {
	const game = load('venticinque', 2);
	const h = newHand(game, { seed: 'c', dealer: 0 });
	const c = h.clone();
	assert.equal(c.checksum(), h.checksum());
	const seat = h.toAct()[0];
	h.apply(seat, h.legal(seat)[0]);
	assert.notEqual(c.checksum(), h.checksum());
	assert.equal(c.log.length, 0);
});
