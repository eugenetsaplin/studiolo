// Legal play on prepared deals: follow suit, must trump, no duty to overtrump, the Fool; the preset deal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, DECK } from '../../core/index.js';
import { load, loadPatched, build, discardNow } from './helpers.js';

const isCups = (c) => c.startsWith('cups:');
const isTrump = (c) => /^T\d+$/.test(c);

const cardsOf = (acts) => acts.map((a) => a.card).sort();

test('follow suit: only the suit (and the Fool) may answer', () => {
	const game = load('venticinque', 2);
	const keep = ['cups:3', 'cups:9', 'T0', 'T5', 'T15'];
	const p = build([28, 25], [keep, ['cups:5', 'T10']], [(c) => isCups(c) && !keep.includes(c), null]);
	const h = newHand(game, { seed: 's', dealer: 0, preset: p });
	assert.deepEqual(h.s.hands[0].length, 28);
	discardNow(h, keep);
	assert.deepEqual(h.toAct(), [1]);
	assert.ok(h.apply(1, { type: 'play', card: 'cups:5' }).ok);
	assert.deepEqual(cardsOf(h.legal(0)), ['T0', 'cups:3', 'cups:9']);
	assert.deepEqual(h.legal(1), []);
});

test('void in the suit: a trump must be played, any trump, no duty to beat (and the Fool)', () => {
	const game = load('venticinque', 2);
	const keep = ['T0', 'T5', 'T15', 'swords:7'];
	const p = build([28, 25], [keep, ['cups:5', 'T10']], [isCups, null]);
	const h = newHand(game, { seed: 's', dealer: 0, preset: p });
	discardNow(h, keep);
	h.apply(1, { type: 'play', card: 'cups:5' });
	const legal = cardsOf(h.legal(0));
	assert.ok(legal.includes('T5') && legal.includes('T15') && legal.includes('T0'));
	assert.ok(!legal.includes('swords:7'));
	assert.ok(legal.every((c) => isTrump(c)));
});

test('a trump led: a trump answers, a lower one too (no duty to overtrump)', () => {
	const game = load('venticinque', 2);
	const keep = ['T0', 'T5', 'T15', 'swords:7'];
	const p = build([28, 25], [keep, ['T10']], [null, null]);
	const h = newHand(game, { seed: 's', dealer: 0, preset: p });
	discardNow(h, keep);
	h.apply(1, { type: 'play', card: 'T10' });
	const legal = cardsOf(h.legal(0));
	assert.ok(legal.includes('T5'), 'a lower trump is legal');
	assert.ok(legal.includes('T15'));
	assert.ok(!legal.includes('swords:7'));
});

test('no suit, no trump: every card is legal', () => {
	const game = load('venticinque', 2);
	const keep = ['swords:7', 'coins:4'];
	const p = build([28, 25], [keep, ['cups:5']], [(c) => isCups(c) || isTrump(c), null]);
	const h = newHand(game, { seed: 's', dealer: 0, preset: p });
	discardNow(h, keep);
	h.apply(1, { type: 'play', card: 'cups:5' });
	assert.equal(h.legal(0).length, 25);
});

test('the Fool led: the next card sets the suit, the owner never wins, takes the Fool back', () => {
	const game = load('partita_3', 3);
	// dealer 0; seat 1 leads. seat 2 answers the Fool with a cup, so seat 0 must follow cups
	const keepD = ['cups:3', 'swords:9'];
	const p = build([28, 25, 25], [keepD, ['T0', 'swords:2'], ['cups:5', 'T9']], [(c) => isCups(c) && !keepD.includes(c), null, null]);
	const h = newHand(game, { seed: 's', dealer: 0, preset: p });
	discardNow(h, keepD);
	assert.deepEqual(h.toAct(), [1]);
	assert.ok(h.apply(1, { type: 'play', card: 'T0' }).ok);
	assert.equal(h.legal(2).length, 25, 'the second player is free');
	assert.ok(h.apply(2, { type: 'play', card: 'cups:5' }).ok);
	const l0 = cardsOf(h.legal(0));
	assert.ok(l0.includes('cups:3') && !l0.includes('swords:9'), 'the third must follow the suit the second set');
	const r = h.apply(0, { type: 'play', card: 'cups:3' });
	assert.ok(r.ok);
	const rec = h.s.tricks[0];
	assert.equal(rec.fool, 1);
	assert.equal(rec.winner, 0, 'cups:3 beats cups:5 (cups: the lower numeral is higher)');
	assert.ok(h.s.won[1].includes('T0'), 'the owner took the Fool back');
	assert.ok(!h.s.won[0].includes('T0'));
	assert.deepEqual(h.toAct(), [0], 'the winner leads');
});

test('the Fool played on a trick it could follow: legal, takes nothing', () => {
	const game = load('venticinque', 2);
	const keep = ['T0', 'cups:3'];
	const p = build([28, 25], [keep, ['cups:5']], [(c) => isCups(c) && !keep.includes(c), null]);
	const h = newHand(game, { seed: 's', dealer: 0, preset: p });
	discardNow(h, keep);
	h.apply(1, { type: 'play', card: 'cups:5' });
	assert.ok(h.apply(0, { type: 'play', card: 'T0' }).ok);
	assert.equal(h.s.tricks[0].winner, 1, 'the leader wins: the Fool is never taken and takes nothing');
	assert.ok(h.s.won[0].includes('T0'));
});

test('the order of the cards: torino, the Angel above the World; cups and coins run backwards', () => {
	const game = load('venticinque', 2);
	const t = game.tables;
	assert.ok(t.trumpStrength.T20 > t.trumpStrength.T21);
	assert.ok(t.trumpStrength.T21 > t.trumpStrength.T19);
	assert.ok(t.trumpStrength.T2 > t.trumpStrength.T1);
	assert.ok(t.suitStrength['cups:1'] > t.suitStrength['cups:10']);
	assert.ok(t.suitStrength['swords:10'] > t.suitStrength['swords:1']);
	assert.ok(t.suitStrength['cups:J'] > t.suitStrength['cups:1']);
	assert.ok(t.suitStrength['swords:K'] > t.suitStrength['swords:Q']);
});

test('the discard: honours are barred, the Bagatto alone is allowed when it is the only trump and the Fool is absent', () => {
	const game = load('partita_3', 3);
	const noTrump = (c) => isTrump(c); // the filler of the dealer holds no trump
	const p = build([28, 25, 25], [['T1', 'swords:K', 'T20', 'T0'], [], []]);
	const h = newHand(game, { seed: 'd', dealer: 0, preset: p });
	const cards = h.legal(0).map((a) => a.card);
	assert.ok(!cards.includes('swords:K') && !cards.includes('T20') && !cards.includes('T0') && !cards.includes('T1'));
	// no Fool, but another trump in the hand: the Bagatto is not alone
	const q = build([28, 25, 25], [['T1', 'swords:K', 'T20'], [], []]);
	const h2 = newHand(game, { seed: 'd', dealer: 0, preset: q });
	assert.ok(!h2.legal(0).some((a) => a.card === 'T1'), 'the Bagatto stays with the Angel in the hand');
	assert.ok(!h2.legal(0).some((a) => a.card === 'T20'));
	// the Bagatto the only trump, no Fool: it may go; the king may not
	const r = build([28, 25, 25], [['T1', 'swords:K'], [], []], [noTrump]);
	const h3 = newHand(game, { seed: 'd', dealer: 0, preset: r });
	assert.ok(h3.legal(0).some((a) => a.card === 'T1'), 'the Bagatto may go when it is the only trump');
	assert.ok(!h3.legal(0).some((a) => a.card === 'swords:K'));
});

test('the discard: when every card left is barred, all become discardable', () => {
	const game = loadPatched('venticinque', 2, (f) => {
		const d = f.hand.phases.find((p) => p.id === 'discard');
		d.settings.barred = { value: ['all'], source: '[S] test' };
	});
	assert.equal(game.support.runnable, true);
	const h = newHand(game, { seed: 'b', dealer: 0 });
	assert.equal(h.legal(0).length, 28, 'everything is barred, so everything may go');
	const q = loadPatched('venticinque', 2, (f) => { f.hand.phases.find((p) => p.id === 'discard').settings.barred = { value: ['suits'], source: '[S] t' }; });
	const h2 = newHand(q, { seed: 'b', dealer: 0 });
	assert.ok(h2.legal(0).every((a) => isTrump(a.card)) || h2.legal(0).length === 28);
});

test('a preset deal: each seat gets its cards, the dealer his extra too, the rest keeps its order', () => {
	const game = load('morto', 2);
	const h1 = ['swords:1', 'swords:2', 'T3'];
	const p = build([28, 25], [h1, ['cups:1']]);
	const restBefore = p.rest.slice();
	const h = newHand(game, { seed: 'p', dealer: 0, preset: p });
	assert.equal(h.s.hands[0].length, 28);
	assert.equal(h.s.hands[1].length, 25);
	for (const c of h1) assert.ok(h.s.hands[0].includes(c));
	assert.ok(h.s.hands[1].includes('cups:1'));
	assert.deepEqual(h.s.stock, restBefore, 'the prize stock keeps the order of the rest');
	assert.equal(h.s.cut, null);
	assert.throws(() => newHand(game, { seed: 'p', dealer: 0, preset: preset([[], []], []) }));
});

test('the prize stock is drawn from its start, one card per trick, by the trick winner', () => {
	const game = load('morto', 2);
	const p = build([28, 25], [['swords:5'], ['swords:9']]);
	const h = newHand(game, { seed: 'p', dealer: 0, preset: p });
	const rest = p.rest.slice();
	discardNow(h, ['swords:5']);
	h.apply(1, { type: 'play', card: 'swords:9' });
	const r = h.apply(0, { type: 'play', card: 'swords:5' });
	assert.ok(r.ok);
	assert.equal(h.s.tricks[0].winner, 1);
	assert.equal(h.s.tricks[0].prize, rest[0]);
	assert.ok(h.s.won[1].includes(rest[0]));
	assert.equal(h.s.stock.length, 24);
	assert.ok(r.events.some((e) => e.e === 'stock_drawn' && e.seat === 1 && e.card === rest[0]));
});
