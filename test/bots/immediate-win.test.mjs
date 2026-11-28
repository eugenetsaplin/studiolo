// Revision 11: the bot sees a card that wins the game at once. Two positions found by an outside check,
// then every position of a random walk where the engine itself certifies a winning card.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { ctxOf, ownPoints, winNowAction } from '../../bots/policy.js';
import { game, level } from './lib.mjs';
import { walk } from './race-lib.mjs';

const easy = level('easy');
const normal = level('normal');
const ask = (g, v, seed, lv = easy) => chooseAction({ game: g, view: v, level: lv, seed });

// the positions of the outside report: a hand reached by random legal play and right claims (seed 26-tactics:<game>:<n>),
// stopped at the first turn where a card wins the game now and another card does not
function reach(id, n, turn) {
	const g = game(id, 2);
	const ctx = ctxOf(g);
	const seed = `26-tactics:${id}:${n}`;
	const h = newHand(g, { seed, dealer: n % 2 });
	const rng = makeRng(seed + ':action');
	for (let t = 0; !h.isOver(); t++) {
		const seat = h.toAct()[0];
		const v = h.view(seat);
		if (t === turn) return { g, h, v, seat };
		const own = ownPoints(ctx, v);
		const claim = v.legal.find((a) => a.type === 'claim_fuora');
		const rest = v.legal.filter((a) => a.type !== 'claim_fuora');
		assert.ok(h.apply(seat, claim && own >= ctx.target ? claim : rest[rng.int(rest.length)]).ok);
	}
	throw new Error('the position was not reached');
}

// every card of the legal list that wins the game at once, by the engine itself: the card, then «fuora», and the judge says «winner»
function engineWins(h, v, seat) {
	return v.legal.filter((a) => {
		if (a.type !== 'play') return false;
		const c = h.clone();
		return c.apply(seat, a).ok && c.apply(seat, { type: 'claim_fuora' }).ok && !!c.result() && c.result().winners.includes(seat);
	}).map((a) => a.card);
}

for (const [id, n, turn, lead, hand, wins, wrong] of [
	// revision 14: a plain card counts 1 at Sedici, the games run otherwise; the position is found anew (same kind: a trionfo that wins, a lower one that does not)
	['sedici_2', 156, 11, 'T10', ['coins:10', 'T14', 'T20'], ['T20'], 'T14'],
	['trentuno', 453, 27, 'coins:8', ['T1', 'T11', 'T17'], ['T1'], 'T11'],
]) {
	test(`immediate win, position 26-tactics:${id}:${n}: the bot plays ${wins[0]}, not ${wrong}`, () => {
		const { g, h, v, seat } = reach(id, n, turn);
		assert.equal(v.trick.cards[0].card, lead);
		assert.deepEqual(v.hand, hand);
		assert.deepEqual(engineWins(h, v, seat), wins, 'the engine certifies the win');
		assert.deepEqual(winNowAction(ctxOf(g), v), { type: 'play', card: wins[0] });
		// every level, with and without the random deviation, over several seeds
		for (const lv of [easy, normal, { ...normal, noise: 0 }, { ...easy, noise: 1 }, level('strong')]) {
			for (let s = 0; s < 6; s++) assert.equal(ask(g, v, `imm${s}`, lv).action.card, wins[0], `${lv.id} noise ${lv.noise}`);
		}
		// it is the game that is won: the card, then «fuora», and the hand is over with the seat as winner
		const c = h.clone();
		assert.ok(c.apply(seat, { type: 'play', card: wins[0] }).ok);
		assert.ok(ask(g, c.view(seat), 'claim').action.type === 'claim_fuora');
	});
}

test('immediate win: wherever a card of a last-card position wins the game by the engine, the bot plays a winning card', () => {
	for (const [id, seats] of [['sedici_2', 2], ['trentuno', 2]]) {
		const g = game(id, seats);
		let positions = 0;
		walk(g, 'imm' + id, 3000, (h, q) => {
			const v = h.view(q);
			if (v.trick.cards.length !== 1 || !v.legal.some((a) => a.type === 'play') || v.points.mine >= v.fuora.target) return; // at the target the bot says «fuora»
			const wins = engineWins(h, v, q);
			if (!wins.length) return;
			positions++;
			const a = ask(g, v, 'p' + positions, normal).action;
			assert.ok(wins.includes(a.card), `${id}: ${a.card} is not one of ${wins} (hand ${v.hand}, lead ${v.trick.cards[0].card}, points ${v.points.mine})`);
		});
		assert.ok(positions >= 20, `${id}: only ${positions} positions with a winning card`);
	}
});

test('immediate win: a card is never named when the seat does not take the trick or does not reach the target', () => {
	for (const [id, seats] of [['sedici_2', 2], ['trentuno', 2]]) {
		const g = game(id, seats);
		const ctx = ctxOf(g);
		walk(g, 'neg' + id, 1500, (h, q) => {
			const v = h.view(q);
			const named = winNowAction(ctx, v);
			if (!named) return;
			assert.ok(engineWins(h, v, q).includes(named.card), `${id}: ${named.card} named but the engine does not win with it`);
		});
	}
});
