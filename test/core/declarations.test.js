// Declarations and the payments made by events (the games with a declarations phase).
import test from 'node:test';
import assert from 'node:assert/strict';
import { replayHand } from '../../core/index.js';
import { handPayments } from '../../core/modules/payments.js';
import { kindAmount } from '../../core/modules/declarations.js';
import { load, bagattDeal, dealerDiscards, checkConserved, playRandom } from './declaration-helpers.js';

const game = load('bagattultimo', 3);
const settleSet = game.plan.find((e) => e.module === 'settle').set;
const types = (h, seat) => h.legal(seat).map((a) => a.type);
const KINGS = ['swords:K', 'batons:K', 'cups:K', 'coins:K'];
const rows = (list) => list.map((p) => [p.from, p.to, p.amount, p.why]).sort();

test('the game with declarations is runnable', () => {
	assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
});

test('honours 3, 4, 5, 6 pay 10, 15, 20, 25; ten trumps pay as many', () => {
	const kinds = game.plan.find((e) => e.module === 'declarations').set.kinds;
	const onori = kinds.find((k) => k.id === 'onori');
	const trionfi = kinds.find((k) => k.id === 'trionfi');
	assert.deepEqual([3, 4, 5, 6, 7].map((n) => kindAmount(onori, n, game.options)), [10, 15, 20, 25, 30]);
	assert.deepEqual([10, 11, 12].map((n) => kindAmount(trionfi, n, game.options)), [10, 11, 12]);
});

test('four honours: one turn, 15 from each other seat; eleven trumps exposed and paid as many', () => {
	const h = bagattDeal(game, [[], [...KINGS], ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']]);
	dealerDiscards(h);
	assert.equal(h.s.phase, 'declarations');
	assert.deepEqual(h.toAct(), [1], 'the first leader declares first');
	assert.deepEqual(types(h, 1).sort(), ['declare_done', 'declare_onori']);
	assert.deepEqual(h.legal(0), [], 'not his turn');
	const r = h.apply(1, { type: 'declare_onori' });
	assert.ok(r.ok);
	assert.deepEqual(r.events, [{ e: 'declared', seat: 1, kind: 'onori', n: 4 }]);
	assert.deepEqual(h.toAct(), [2], 'seat 1 has nothing more to declare: the turn goes on');
	assert.deepEqual(types(h, 2).sort(), ['declare_done', 'declare_trionfi']);
	const r2 = h.apply(2, { type: 'declare_trionfi' });
	assert.equal(r2.events[0].cards.length, 11);
	assert.equal(r2.events[0].n, 11);
	const pay = handPayments(h, { payments: [] });
	assert.deepEqual(rows(pay.filter((p) => p.to === 1)), [[0, 1, 15, 'declaration'], [2, 1, 15, 'declaration']]);
	assert.deepEqual(rows(pay.filter((p) => p.to === 2)), [[0, 2, 11, 'declaration'], [1, 2, 11, 'declaration']]);
	const v = h.view(0).declarations;
	assert.equal(v.made.find((d) => d.kind === 'trionfi').cards.length, 11, 'exposed cards are public');
	assert.equal(v.made.find((d) => d.kind === 'onori').cards, undefined, 'honours are only counted');
	checkConserved(h);
});

test('Angel, Bagatto and Fool: three honours and Mitigati, 10 on top', () => {
	const h = bagattDeal(game, [[], ['T20', 'T1', 'T0'], []]);
	dealerDiscards(h);
	assert.deepEqual(types(h, 1).sort(), ['declare_done', 'declare_mitigati', 'declare_onori']);
	h.apply(1, { type: 'declare_onori' });
	assert.deepEqual(h.toAct(), [1], 'the same seat goes on while it has a kind left');
	assert.deepEqual(types(h, 1).sort(), ['declare_done', 'declare_mitigati']);
	h.apply(1, { type: 'declare_mitigati' });
	const pay = handPayments(h, { payments: [] }).filter((p) => p.to === 1);
	assert.deepEqual(pay.map((p) => p.amount).sort(), [10, 10, 10, 10]);
});

const onlyMitigati = () => {
	const h = bagattDeal(game, [[], ['T20', 'T1', 'T0'], []]);
	dealerDiscards(h);
	return h;
};
const got = (h, seat) => handPayments(h, { payments: [] }).filter((p) => p.to === seat);

test('Mitigati alone carries the three honours: 10 + 10 from each, whatever the order of the buttons', () => {
	const a = onlyMitigati();
	const r = a.apply(1, { type: 'declare_mitigati' });
	assert.deepEqual(r.events.map((e) => e.kind), ['mitigati', 'onori']);
	assert.deepEqual(got(a, 1).map((p) => p.amount).sort(), [10, 10, 10, 10]);
	assert.ok(types(a, 1).includes('declare_onori'), 'the honours stay on offer, so that naming them is not refused');
	assert.ok(a.apply(1, { type: 'declare_onori' }).ok);
	assert.deepEqual(got(a, 1).map((p) => p.amount).sort(), [10, 10, 10, 10], 'Mitigati first, then the honours: nothing more is paid');
	assert.deepEqual(a.s.m.declarations.made.map((d) => d.kind), ['mitigati', 'onori']);
	assert.ok(!types(a, 1).includes('declare_onori'), 'named once, gone');
	const b = onlyMitigati();
	b.apply(1, { type: 'declare_onori' });
	b.apply(1, { type: 'declare_mitigati' });
	assert.deepEqual(got(b, 1).map((p) => p.amount).sort(), [10, 10, 10, 10], 'honours first: no double payment');
	assert.equal(b.s.m.declarations.made.filter((d) => d.kind === 'onori').length, 1);
});

test('Mitigati with four honours pays the honours once, by the larger count', () => {
	const h = bagattDeal(game, [[], ['T20', 'T1', 'T0', 'swords:K'], []]);
	dealerDiscards(h);
	h.apply(1, { type: 'declare_mitigati' });
	assert.deepEqual(got(h, 1).filter((p) => p.why === 'declaration').map((p) => p.amount).sort(), [10, 10, 15, 15]);
	assert.equal(h.s.m.declarations.made.find((d) => d.kind === 'onori').n, 4);
});

test('declare_done closes the right of the seat; the others still speak', () => {
	const h = bagattDeal(game, [[], [...KINGS], []]);
	dealerDiscards(h);
	assert.ok(h.apply(1, { type: 'declare_done' }).ok);
	assert.equal(handPayments(h, { payments: [] }).filter((p) => p.to === 1).length, 0);
	assert.ok(!h.toAct().includes(1));
	assert.deepEqual(h.legal(1), []);
	assert.ok(!h.apply(1, { type: 'declare_onori' }).ok);
	while (h.s.phase === 'declarations') h.apply(h.toAct()[0], { type: 'declare_done' });
	assert.equal(h.s.phase, 'tricks');
	assert.ok(!h.legal(h.toAct()[0]).some((a) => a.type.startsWith('declare_')));
});

test('a seat with nothing to declare gets no turn', () => {
	const h = bagattDeal(game, [[], [], []]);
	dealerDiscards(h);
	assert.ok(!h.toAct().includes(1) && !h.toAct().includes(2));
});

// a hand whose tricks are written by hand: the Bagatto events
function withTricks(tricks) {
	const h = bagattDeal(game, [[], [], []]);
	h.s.tricks = tricks;
	h.s.result = { winners: [] };
	return h;
}
const trick = (cards, winner) => ({ leader: cards[0][0], cards: cards.map(([seat, card]) => ({ seat, card })), winner, fool: null, prize: null });
const filler = trick([[1, 'swords:2'], [2, 'swords:3'], [0, 'swords:4']], 0);

test('the Bagatto in the last trick: won 30 from each, lost 30 to each; lost before: 5 to each', () => {
	const won = handPayments(withTricks([filler, trick([[2, 'T1'], [0, 'T3'], [1, 'swords:5']], 2)]), settleSet);
	assert.deepEqual(rows(won), [[0, 2, 30, 'bagatto_last'], [1, 2, 30, 'bagatto_last']]);
	const lost = handPayments(withTricks([filler, trick([[2, 'T1'], [0, 'T9'], [1, 'T7']], 0)]), settleSet);
	assert.deepEqual(rows(lost), [[2, 0, 30, 'bagatto_lost_last'], [2, 1, 30, 'bagatto_lost_last']]);
	const before = handPayments(withTricks([trick([[1, 'T1'], [2, 'T4'], [0, 'swords:3']], 2), filler]), settleSet);
	assert.deepEqual(rows(before), [[1, 0, 5, 'bagatto_lost'], [1, 2, 5, 'bagatto_lost']]);
	const quiet = handPayments(withTricks([trick([[1, 'T1'], [2, 'swords:3'], [0, 'swords:4']], 1), filler]), settleSet);
	assert.deepEqual(quiet, [], 'a Bagatto that takes its trick before the last pays nothing');
});

test('whole hands: the log replays, cards are kept, the payments balance, two payers per declaration', () => {
	for (let i = 0; i < 40; i++) {
		const h = playRandom(game, 'k3-bag-' + i, i % 3);
		assert.equal(h.s.over, true);
		const again = replayHand(game, { seed: 'k3-bag-' + i, dealer: i % 3 }, h.s.log);
		assert.equal(again.checksum(), h.checksum());
		const pay = handPayments(h, settleSet);
		const net = new Array(3).fill(0);
		for (const p of pay) { net[p.from] -= p.amount; net[p.to] += p.amount; }
		assert.equal(net.reduce((a, b) => a + b, 0), 0);
		const made = h.s.m.declarations.made.length;
		assert.equal(pay.filter((p) => p.why === 'declaration').length, made * 2);
		checkConserved(h);
	}
});
