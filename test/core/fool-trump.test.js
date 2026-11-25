// cards.fool "trump": the Fool is an ordinary trionfo, the lowest of the order. Bagatto takes it, it takes plain cards
// as a trionfo, a lone Fool must answer a trionfo, it counts its card points, no Fool exchange happens.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand } from '../../core/index.js';
import { build, loadPatched, playRandom } from './helpers.js';
import { load, livePoints } from './race-helpers.js';

const game = load('sedici_2', 2);

// seat 1 holds `lead` and `mine`, seat 0 holds `theirs`; the dealer is seat 0, so seat 1 leads
function deal(mine, theirs) {
	return newHand(game, { seed: 'f', dealer: 0, preset: build([4, 4], [theirs, mine]) });
}
const cards = (h, seat) => h.legal(seat).filter((a) => a.type === 'play').map((a) => a.card).sort();

test('the Fool is the lowest trionfo: Bagatto takes it and so does every other trionfo', () => {
	for (const [lead, answer, taker] of [['T1', 'T0', 1], ['T0', 'T1', 0], ['T0', 'T2', 0], ['T5', 'T0', 1]]) {
		const h = deal([lead, 'swords:2', 'cups:2', 'coins:2'], [answer, 'swords:3', 'cups:3', 'coins:3']);
		assert.ok(h.apply(1, { type: 'play', card: lead }).ok);
		assert.ok(h.apply(0, { type: 'play', card: answer }).ok);
		assert.equal(h.s.tricks[0].winner, taker);
		assert.equal(h.s.tricks[0].fool, null, 'the Fool is not an excuse');
		assert.ok(h.s.won[taker].includes('T0'), 'the Fool goes with the trick');
	}
});

test('the Fool takes plain cards like any trionfo, and the Fool led makes trionfi the led suit', () => {
	const h = deal(['swords:5', 'cups:2', 'coins:2', 'batons:2'], ['T0', 'cups:3', 'coins:3', 'batons:3']);
	assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.deepEqual(cards(h, 0), ['T0'], 'void in swords with a trionfo: the trionfo must be played');
	assert.ok(h.apply(0, { type: 'play', card: 'T0' }).ok);
	assert.equal(h.s.tricks[0].winner, 0);
	// the Fool leads: a trionfo is led, the other seat must answer with a trionfo if it has one
	const g = deal(['swords:5', 'cups:2', 'coins:2', 'batons:2'], ['T3', 'cups:3', 'coins:3', 'batons:3']);
	const m = newHand(game, { seed: 'f', dealer: 0, preset: build([4, 4], [['T3', 'cups:3', 'coins:3', 'batons:3'], ['T0', 'cups:2', 'coins:2', 'batons:2']]) });
	assert.ok(m.apply(1, { type: 'play', card: 'T0' }).ok);
	assert.deepEqual(cards(m, 0), ['T3']);
	assert.ok(g);
});

test('a lone Fool must answer a trionfo; with another trionfo the seat may choose', () => {
	const lone = deal(['T9', 'swords:2', 'cups:2', 'coins:2'], ['T0', 'swords:3', 'cups:3', 'coins:3']);
	assert.ok(lone.apply(1, { type: 'play', card: 'T9' }).ok);
	assert.deepEqual(cards(lone, 0), ['T0']);
	const two = deal(['T9', 'swords:2', 'cups:2', 'coins:2'], ['T0', 'T4', 'cups:3', 'coins:3']);
	assert.ok(two.apply(1, { type: 'play', card: 'T9' }).ok);
	assert.deepEqual(cards(two, 0), ['T0', 'T4']);
});

test('the Fool counts one point, and no Fool exchange happens at the end', () => {
	const h = deal(['T1', 'swords:2', 'cups:2', 'coins:2'], ['T0', 'swords:3', 'cups:3', 'coins:3']);
	assert.ok(h.apply(1, { type: 'play', card: 'T1' }).ok);
	assert.ok(h.apply(0, { type: 'play', card: 'T0' }).ok);
	assert.equal(livePoints(h, 1), 6, 'Bagatto 5 and the Fool 1');
	assert.equal(h.s.foolGive, null);
	const none = newHand(game, { seed: 'g', dealer: 0 });
	assert.equal(none.s.foolGive, null);
});

test('the Fool as a trump needs T0 in the explicit trump order', () => {
	assert.equal(game.support.runnable, true);
	const bad = loadPatched('sedici_2', 2, (f) => { f.cards.trump_order.value = f.cards.trump_order.value.filter((x) => x !== 'T0'); });
	assert.equal(bad.support.runnable, false);
	assert.ok(bad.support.missing.some((m) => m.path === 'cards.fool'));
});

// Trent'uno variant «Prammatica [1846]» (rules revision 8): the Fool takes Bagatto, every other trionfo takes the Fool
test('trentuno variant prammatica_1846: the Fool takes Bagatto, and one hand plays to its end', () => {
	const g = load('trentuno', 2, { variant: 'prammatica_1846' });
	assert.equal(g.support.runnable, true, JSON.stringify(g.support.missing));
	const fill = (c) => [c, 'swords:2', 'cups:2', 'coins:2', 'batons:2', 'swords:4', 'cups:4', 'coins:4'];
	const theirs = (c) => [c, 'swords:3', 'cups:3', 'coins:3', 'batons:3', 'swords:6', 'cups:6', 'coins:6'];
	for (const [lead, answer, taker] of [['T1', 'T0', 0], ['T0', 'T1', 1], ['T0', 'T2', 0], ['T2', 'T0', 1]]) {
		const h = newHand(g, { seed: 'p', dealer: 0, preset: build([8, 8], [theirs(answer), fill(lead)]) });
		assert.ok(h.apply(1, { type: 'play', card: lead }).ok);
		assert.ok(h.apply(0, { type: 'play', card: answer }).ok);
		assert.equal(h.s.tricks[0].winner, taker, `${lead} led, ${answer} answered`);
	}
	const base = load('trentuno', 2);
	const h0 = newHand(base, { seed: 'p', dealer: 0, preset: build([8, 8], [theirs('T0'), fill('T1')]) });
	assert.ok(h0.apply(1, { type: 'play', card: 'T1' }).ok);
	assert.ok(h0.apply(0, { type: 'play', card: 'T0' }).ok);
	assert.equal(h0.s.tricks[0].winner, 1, 'without the variant Bagatto takes the Fool');
	const h = playRandom(g, 'pram', 0);
	assert.ok(h.isOver());
});
