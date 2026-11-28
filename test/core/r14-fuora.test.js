// Revision 14: the alt readings of «fuora» play right (hand_ends pays its row in race points, after_trick keeps its window
// at the end of a packet, first_reached stays the winner after a false claim that ends the hand); a vola is named in the result.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand } from '../../core/index.js';
import { build, loadPatched } from './helpers.js';
import { load, scene, giveWon, playFirstTrick, valueOf, targetOf } from './race-helpers.js';

test('r14: after_false_claim hand_ends: the race points follow the row that is paid (a double row is two)', () => {
	const game = load('sedici_2', 2, { alts: ['hand.phases[fuora].settings.after_false_claim'] });
	const lead = 'swords:5';
	const answer = 'swords:2';
	const h = scene(game, lead, answer);
	giveWon(h, 1, 7 - valueOf(game, lead) - valueOf(game, answer));
	playFirstTrick(h, lead, answer);
	assert.ok(h.apply(1, { type: 'claim_fuora' }).ok);
	const res = h.result();
	assert.deepEqual(res.winners, [0]);
	const pay = res.payments.filter((p) => p.why === 'false_claim');
	assert.equal(pay.length, 1);
	assert.deepEqual(res.gamePoints, { 0: 2, 1: 0 }, 'a marcia row: two points of the race, as two stakes');
});

test('r14: claim_when after_trick with deal_on: the taker of the last trick of a packet keeps his window', () => {
	const game = loadPatched('sedici_2', 2, (f) => { f.hand.phases.find((p) => p.id === 'fuora').settings.claim_when.value = 'after_trick'; });
	const make = () => {
		const lead = 'swords:5';
		const answer = 'swords:2';
		const h = scene(game, lead, answer);
		giveWon(h, 1, targetOf(game) - valueOf(game, lead) - valueOf(game, answer));
		h.s.hands = [[answer], [lead]]; // each seat holds the one card of the trick: the packet ends with it
		playFirstTrick(h, lead, answer);
		return h;
	};
	const h = make();
	assert.ok(h.s.rest.length >= h.dealNeed(), 'a packet is still to come');
	assert.deepEqual(h.toAct(), [1], 'the engine waits for the taker of the last trick');
	assert.deepEqual(h.legal(1).map((a) => a.type), ['pass_fuora', 'claim_fuora']);
	assert.ok(h.apply(1, { type: 'claim_fuora' }).ok);
	assert.ok(h.isOver());
	assert.deepEqual(h.result().winners, [1]);
	// he may let it pass: the next packet is dealt
	const g = make();
	assert.ok(g.apply(1, { type: 'pass_fuora' }).ok);
	assert.ok(!g.isOver());
	assert.ok(g.s.hands.every((l) => l.length > 0), 'the next packet is dealt');
	assert.ok(g.toAct().length > 0);
});

test('r14: prammatica_1846 with hand_ends: a false claim does not take the game from the seat that made the points first', () => {
	const game = load('trentuno', 3, { variant: 'prammatica_1846', alts: ['hand.phases[fuora].settings.after_false_claim'] });
	const target = targetOf(game);
	const size = game.plan.find((x) => x.module === 'deal').set.hand_size;
	const h = newHand(game, { seed: 'r14', dealer: 0, preset: build([size, size, size], [['swords:3'], ['swords:5'], ['swords:2']]) });
	giveWon(h, 1, target + 1 - valueOf(game, 'swords:5') - valueOf(game, 'swords:2') - valueOf(game, 'swords:3'));
	assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.ok(h.apply(2, { type: 'play', card: 'swords:2' }).ok);
	assert.ok(h.apply(0, { type: 'play', card: 'swords:3' }).ok);
	assert.equal(h.s.m.fuora.reached, 1);
	h.s.m.tricks.turn = 2; // seat 2, who has nothing, says «fuora»
	const r = h.apply(2, { type: 'claim_fuora' });
	assert.ok(r.ok);
	assert.ok(h.isOver());
	const res = h.result();
	assert.deepEqual(res.winners, [1], 'the first to have made the points stays the winner');
	assert.equal(res.reason, 'fuora');
	assert.deepEqual(res.gamePoints, { 0: 2, 1: 2, 2: 0 });
});

// ---- a vola is named in the result (meno, eight cards) ----
import { load as loadC, newH, deal, playOut as playOutC } from '../check-core/lib.mjs';
const TOP = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14'];
const LOW = ['swords:1', 'swords:2', 'swords:3', 'swords:4', 'swords:5', 'swords:6', 'swords:7', 'swords:8'];
test('r14: meno eight_cards: the vola is in the result of the hand; the base game has no such mark', () => {
	const g = loadC('meno', 2, { variant: 'eight_cards' });
	const p = deal([8, 8], [TOP, LOW]);
	const h = newH(g, 'vola2', 0, { preset: p });
	playOutC(h, { pick: (hh, seat, legal) => legal[0] });
	const r = h.result();
	assert.deepEqual(r.winners, [0]);
	assert.equal(r.vola, true);
	// the base game and four cards know no vola
	const base = playRandomHand(loadC('meno', 2));
	assert.equal(base.vola, undefined);
});
function playRandomHand(game) {
	const h = newHand(game, { seed: 'plain', dealer: 0 });
	let guard = 0;
	while (!h.isOver() && guard++ < 500) { const q = h.toAct()[0]; h.apply(q, h.legal(q)[0]); }
	return h.result();
}
