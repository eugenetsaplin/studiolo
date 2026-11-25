// The deal with piles (Baronetti), the preset of piles, and the rounds from the stock (Sedici).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, replayHand, DECK } from '../../core/index.js';
import { load, checkConserved } from './helpers.js';

const piles = (h) => h.s.piles;

test('the Baronetti deal: 39 and 39, four piles 10, 10, 10, 9, tops open, nothing left', () => {
	const game = load('baronetti', 2);
	assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
	for (const dealer of [0, 1]) {
		const h = newHand(game, { seed: 'bar' + dealer, dealer });
		for (const seat of [0, 1]) {
			assert.equal(h.s.hands[seat].length, 39);
			assert.deepEqual(piles(h)[seat].map((p) => p.cards.length), [10, 10, 10, 9]);
			assert.ok(piles(h)[seat].every((p) => p.open));
			assert.deepEqual([...piles(h)[seat].flatMap((p) => p.cards)].sort(), [...h.s.hands[seat]].sort());
		}
		assert.equal(h.s.rest.length, 0);
		assert.equal(new Set(h.s.hands.flat()).size, 78);
		checkConserved(h);
		assert.equal(h.s.phase, 'tricks');
		assert.deepEqual(h.toAct(), [(dealer + 1) % 2], "the dealer's opponent leads");
	}
});

test('the same seed and dealer deal the same piles', () => {
	const game = load('baronetti', 2);
	const h = newHand(game, { seed: 'order', dealer: 0 });
	const g = newHand(game, { seed: 'order', dealer: 0 });
	assert.equal(h.checksum(), g.checksum());
	const flat = [0, 1].flatMap((q) => piles(h)[q].flatMap((p) => p.cards));
	assert.equal(new Set(flat).size, 78);
});

// piles laid exactly: pile p of each seat holds the next cards of the deck, the opponent of the dealer (seat 1) first
function layout() {
	const deck = DECK.slice();
	const p = { 0: [], 1: [] };
	for (const size of [10, 10, 10, 9]) for (const seat of [1, 0]) p[seat].push(deck.splice(0, size));
	return { piles: p, rest: [] };
}

test('preset.piles lays the piles exactly; the top is the last card', () => {
	const game = load('baronetti', 2);
	const pre = layout();
	const h = newHand(game, { seed: 'x', dealer: 0, preset: pre });
	assert.deepEqual(piles(h)[1].map((p) => p.cards), pre.piles[1]);
	assert.deepEqual(piles(h)[0].map((p) => p.cards), pre.piles[0]);
	const tops = pre.piles[1].map((c) => c[c.length - 1]);
	assert.deepEqual(h.view(1).hand, [...tops].sort((a, b) => DECK.indexOf(a) - DECK.indexOf(b)));
});

test('a wrong preset of piles is refused', () => {
	const game = load('baronetti', 2);
	const bad = layout();
	bad.piles[1][0].pop();
	assert.throws(() => newHand(game, { seed: 'x', dealer: 0, preset: bad }), /must hold 10/);
	const dup = layout();
	dup.piles[0][0][0] = dup.piles[1][0][0];
	assert.throws(() => newHand(game, { seed: 'x', dealer: 0, preset: dup }), /whole deck/);
	const hands = { hands: { 0: ['swords:1'], 1: [] }, piles: layout().piles, rest: [] };
	assert.throws(() => newHand(game, { seed: 'x', dealer: 0, preset: hands }), /piles/);
});

test('Sedici: the first round is dealt from the pack, the next from the stock as it lies', () => {
	const game = load('sedici_2', 2);
	assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
	const pre = { hands: { 0: DECK.slice(0, 4), 1: DECK.slice(4, 8) }, rest: DECK.slice(8) };
	const h = newHand(game, { seed: 's', dealer: 0, preset: pre });
	assert.equal(h.s.rest.length, 70);
	assert.equal(h.s.round, 0);
	for (let i = 0; i < 8; i++) {
		const seat = h.toAct()[0];
		const play = h.legal(seat).find((a) => a.type === 'play');
		assert.ok(h.apply(seat, play).ok);
	}
	assert.equal(h.s.round, 1, 'the second round is dealt');
	assert.deepEqual(h.s.hands.map((l) => l.length), [4, 4]);
	assert.equal(h.s.rest.length, 62);
	assert.deepEqual([...h.s.hands[1], ...h.s.hands[0]].sort(), DECK.slice(8, 16).sort(), 'from the top of the stock, in order');
	checkConserved(h);
	assert.equal(h.view(0).round.index, 1);
	assert.equal(h.view(0).round.stock, 62);
});

test('Sedici: games by play without a claim end when the stock is empty; every card once; replay equal', () => {
	const game = load('sedici_2', 2);
	for (const seed of ['a', 'b', 'c']) {
		const h = newHand(game, { seed, dealer: 1 });
		let guard = 0;
		while (!h.isOver() && guard++ < 2000) {
			const seat = h.toAct()[0];
			const legal = h.legal(seat).filter((a) => a.type !== 'claim_fuora');
			const act = legal.length ? legal[(guard * 7) % legal.length] : h.legal(seat)[0];
			assert.ok(h.apply(seat, act).ok);
			checkConserved(h);
		}
		assert.ok(h.isOver(), 'the game ends (a claim or the empty stock)');
		const init = { seed, dealer: 1, carry: h.s.carry };
		assert.equal(replayHand(game, init, h.log).checksum(), h.checksum());
	}
});
