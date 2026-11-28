// Revision 14: the call of a card follows the order of the trumps of the game file, not the printed number.
// In the games of Torino 1787 the Angel XX stands above the World XXI, so the bot calls the Angel first.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ctxOf, callAction } from '../../bots/policy.js';
import { game } from './lib.mjs';

const calls = (...cards) => cards.map((card) => ({ type: 'call', card }));
const hand = ['T5', 'T8', 'T12', 'T15', 'T3', 'T1'];

test('Permesso: with one call and both the Angel and the World possible, the bot calls the Angel', () => {
	for (const [id, seats] of [['permesso_3', 3], ['permesso_5', 5], ['chiamare_il_re', 4]]) {
		const ctx = ctxOf(game(id, seats));
		assert.equal(callAction(ctx, hand, calls('T21', 'T20')).card, 'T20', id);
		assert.equal(callAction(ctx, hand, calls('T20', 'T21')).card, 'T20', id);
		assert.equal(callAction(ctx, hand, calls('T21', 'T19')).card, 'T21', id + ': the World still above the nineteenth');
	}
});

test('a game with the printed order of the trumps: the order of the calls is unchanged', () => {
	const ctx = { ...ctxOf(game('permesso_3', 3)), strength: (id) => Number(id.slice(1)) };
	// a stand-in context: strength by the printed number, as the file says «printed»
	const c = { ...ctx, strength: (id) => (id[0] === 'T' ? Number(id.slice(1)) : ctx.strength(id)) };
	assert.equal(callAction(c, hand, calls('T21', 'T20')).card, 'T21');
	assert.equal(callAction(c, hand, calls('T19', 'T20')).card, 'T20');
});
