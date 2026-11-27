// The two deals and the two discards of the two-seat game with a second deal (half_rest, from rest).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, replayHand } from '../../core/index.js';
import { cardsNeeded } from '../../core/modules/deal.js';
import { handPayments } from '../../core/modules/payments.js';
import { loadPatched, checkConserved, playRandom } from './declaration-helpers.js';

// the file as REVISIONS.md records it (revision 2): the first discard is exact
const exact = (f) => { f.hand.phases.find((p) => p.id === 'discard_first').settings.count_mode.value = 'exact'; };
const game = loadPatched('mitigati_2', 2, exact);
const settleSet = game.plan.find((e) => e.module === 'settle').set;

function discardAll(h) {
	const seat = h.toAct()[0];
	const a = h.legal(seat)[0];
	assert.ok(h.apply(seat, a).ok);
}

test('the file is runnable (half_rest, from rest, declarations)', () => {
	assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
	assert.ok(game.plan.filter((e) => e.module === 'deal').length === 2 && game.plan.filter((e) => e.module === 'discard').length === 2);
});

test('26 and 25, 13 and 12 away, then 15 and 12, three away: 25 each, 25 in the discards', () => {
	for (const dealer of [0, 1]) {
		const other = 1 - dealer;
		const h = newHand(game, { seed: 'k3-m2-' + dealer, dealer });
		assert.equal(h.s.phase, 'discard_first');
		assert.equal(h.s.hands[dealer].length, 26);
		assert.equal(h.s.hands[other].length, 25);
		assert.equal(h.s.rest.length, 27);
		assert.deepEqual(h.toAct(), [other], 'the non-dealer discards first');
		for (let i = 0; i < 12; i++) discardAll(h);
		assert.deepEqual(h.toAct(), [dealer]);
		for (let i = 0; i < 13; i++) discardAll(h);
		assert.equal(h.s.phase, 'discard_second');
		assert.equal(h.s.hands[dealer].length, 13 + 15);
		assert.equal(h.s.hands[other].length, 13 + 12);
		assert.equal(h.s.rest.length, 0);
		assert.equal(h.s.discard[dealer].length, 13);
		for (let i = 0; i < 3; i++) discardAll(h);
		assert.equal(h.s.hands[0].length, 25);
		assert.equal(h.s.hands[1].length, 25);
		assert.equal(h.s.discard[dealer].length, 16);
		assert.equal(h.s.discard[other].length, 12);
		checkConserved(h);
		assert.equal(new Set([...h.s.hands[0], ...h.s.hands[1], ...h.s.discard[0], ...h.s.discard[1]]).size, 78);
		assert.ok(['declarations', 'tricks'].includes(h.s.phase));
	}
});

test('the state of each deal and discard is kept by its phase id', () => {
	const h = newHand(game, { seed: 'k3-ids', dealer: 0 });
	assert.ok(h.s.m.deal_first && !h.s.m.deal && !h.s.m.deal_second);
	while (h.s.phase === 'discard_first') discardAll(h);
	assert.ok(h.s.m.deal_second && h.s.m.deal_second.finished);
	assert.ok(h.s.m.discard_first && h.s.m.discard_second);
});

test('the second deal does not change the first hands: the kept cards stay, the new ones come from the rest in order', () => {
	const h = newHand(game, { seed: 'k3-keep', dealer: 1 });
	const rest = h.s.rest.slice();
	while (h.s.phase === 'discard_first') discardAll(h);
	const gone = new Set([...h.s.discard[0], ...h.s.discard[1]]);
	assert.equal(gone.size, 25);
	const fresh = [...h.s.hands[0], ...h.s.hands[1]].filter((c) => rest.includes(c));
	assert.equal(fresh.length, 27);
	assert.equal(cardsNeeded(h) >= 0, true);
});

test('hand_size half_rest needs from rest, and from rest needs half_rest', () => {
	const bad1 = loadPatched('mitigati_2', 2, (f) => { exact(f); delete f.hand.phases.find((p) => p.id === 'deal_second').settings.from; });
	assert.equal(bad1.support.runnable, false);
	const bad2 = loadPatched('mitigati_2', 2, (f) => { exact(f); f.hand.phases.find((p) => p.id === 'deal_first').settings.from = { value: 'rest', source: '[S] test' }; });
	assert.equal(bad2.support.runnable, false);
});

// the window before revision 11 (the alt): one declaring turn for each seat before the first card
const oldWindow = loadPatched('mitigati_2', 2, exact, { alts: ['hand.phases[declarations].settings.window'] });

test('the alt window: the declarations come after both discards, before the first card, in play order', () => {
	let seen = 0;
	for (let i = 0; i < 60; i++) {
		const h = newHand(oldWindow, { seed: 'k3-m2d-' + i, dealer: i % 2 });
		while (['discard_first', 'discard_second'].includes(h.s.phase)) discardAll(h);
		if (h.s.phase !== 'declarations') { assert.equal(h.s.phase, 'tricks'); continue; }
		seen++;
		assert.deepEqual(h.toAct().length, 1);
		const first = h.toAct()[0];
		assert.deepEqual(h.legal(1 - first), [], 'only the seat to speak has actions');
		assert.ok(h.legal(first).some((a) => a.type === 'declare_done'));
	}
	assert.ok(seen > 0, 'some deal offers a declaration');
});

// a hand at the first card of the first trick
function atFirstCard(i) {
	const h = newHand(game, { seed: 'p' + i, dealer: i % 2 });
	while (h.s.phase !== 'tricks') discardAll(h);
	return h;
}
const declTypes = (h, seat) => h.legal(seat).filter((a) => a.type.startsWith('declare_')).map((a) => a.type);
const play = (h, seat) => assert.ok(h.apply(seat, h.legal(seat).find((a) => a.type === 'play')).ok);
const got = (h, seat) => handPayments(h, { payments: [] }).filter((p) => p.to === seat);

test('window of the first trick: no turns before the first card; the declaring is at the seat own choice, with its card', () => {
	const h = atFirstCard(3);
	assert.equal(h.s.phase, 'tricks');
	const lead = h.toAct()[0];
	assert.deepEqual(declTypes(h, lead), ['declare_onori', 'declare_trionfi']);
	assert.ok(h.legal(lead).slice(0, -2).every((a) => a.type === 'play'), 'the cards come first');
	assert.deepEqual(h.legal(1 - lead), [], 'not his turn');
	assert.deepEqual(h.view(lead).declarations.offer, ['onori', 'trionfi']);
	assert.equal(h.view(lead).declarations.open, true);
});

test('declared after the answer of the opponent, before the first trick is closed: it is paid', () => {
	const h = atFirstCard(3);
	const lead = h.toAct()[0];
	play(h, lead);
	assert.deepEqual(declTypes(h, lead), [], 'the opponent is to play');
	play(h, 1 - lead);
	assert.equal(h.s.tricks.length, 0, 'the trick is not closed: somebody may still declare');
	assert.deepEqual(h.toAct(), [lead]);
	assert.equal(h.legal(lead)[0].type, 'declare_done', 'continue comes first');
	assert.deepEqual(h.legal(1 - lead), []);
	assert.deepEqual(h.view(lead).declarations.closing, true);
	assert.ok(h.apply(lead, { type: 'declare_onori' }).ok);
	assert.ok(got(h, lead).length > 0 && got(h, lead).every((p) => p.from === 1 - lead));
	// the seat is still on turn for a kind left; the opponent follows, then the trick closes
	while (h.s.tricks.length === 0) { const q = h.toAct()[0]; assert.ok(h.apply(q, h.legal(q)[0]).ok); }
	assert.equal(h.s.tricks.length, 1);
});

test('declared with the first card and before it: paid once, not offered again at the end', () => {
	const h = atFirstCard(3);
	const lead = h.toAct()[0];
	assert.ok(h.apply(lead, { type: 'declare_onori' }).ok);
	assert.ok(!declTypes(h, lead).includes('declare_onori'));
	play(h, lead);
	play(h, 1 - lead);
	assert.ok(!declTypes(h, lead).includes('declare_onori'));
	assert.equal(got(h, lead).length, 1);
});

test('after the first trick is closed nothing can be declared', () => {
	const h = atFirstCard(3);
	const lead = h.toAct()[0];
	play(h, lead);
	play(h, 1 - lead);
	while (h.s.tricks.length === 0) { const q = h.toAct()[0]; assert.ok(h.apply(q, h.legal(q)[0]).ok); }
	assert.equal(h.view(lead).declarations.open, false);
	for (const q of [0, 1]) assert.deepEqual(declTypes(h, q), []);
	const q = h.toAct()[0];
	assert.ok(!h.apply(q, { type: 'declare_trionfi' }).ok);
	assert.ok(!h.apply(q, { type: 'declare_done' }).ok);
});

test('whole hands: the log replays, cards are kept, the payments balance', () => {
	for (let i = 0; i < 30; i++) {
		const h = playRandom(game, 'k3-m2-' + i, i % 2);
		assert.equal(h.s.over, true);
		assert.equal(replayHand(game, { seed: 'k3-m2-' + i, dealer: i % 2 }, h.s.log).checksum(), h.checksum());
		const net = [0, 0];
		for (const p of handPayments(h, settleSet)) { net[p.from] -= p.amount; net[p.to] += p.amount; }
		assert.equal(net[0] + net[1], 0);
		checkConserved(h);
		assert.equal(h.s.hands.flat().length, 0);
	}
});
