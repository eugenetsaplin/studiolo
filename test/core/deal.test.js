// The deal: the arithmetic of the hand sizes for every seat count, the packet rounds with the a_monte windows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand } from '../../core/index.js';
import { load } from './helpers.js';

test('the deal arithmetic of the game for two to seven seats', () => {
	const size = { 2: 25, 3: 25, 4: 19, 5: 15, 6: 13, 7: 11 };
	for (let n = 2; n <= 7; n++) {
		const game = load('meno', n);
		assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
		const h = newHand(game, { seed: 'm' + n, dealer: n - 1 });
		for (let s = 0; s < n; s++) assert.equal(h.s.hands[s].length, size[n], `seat ${s} of ${n}`);
		assert.equal(h.s.rest.length, 78 - n * size[n]);
		assert.equal(h.s.stock.length, 0);
		assert.equal(h.s.phase, 'tricks');
		assert.deepEqual(h.toAct(), [0], 'the right of the dealer leads');
		assert.equal(new Set(h.s.hands.flat()).size, n * size[n]);
	}
	assert.equal(load('meno', 2).seats, 2);
	assert.throws(() => load('meno', 1));
	assert.throws(() => load('meno', 8));
});

test('seats a game is not played with are listed in the support', () => {
	const g = load('venticinque', 3);
	assert.equal(g.support.runnable, false);
	assert.ok(g.support.missing.some((m) => m.path === 'seats.count'));
	assert.throws(() => newHand(g, { seed: 'x', dealer: 0 }));
});

test('dealer, deal and cut are recorded; the cut keeps the whole pack', () => {
	const game = load('partita_3', 3);
	const h = newHand(game, { seed: 'cut', dealer: 2 });
	const s = h.snapshot();
	assert.equal(s.dealer, 2);
	assert.ok(Number.isInteger(s.cut) && s.cut >= 2 && s.cut <= 76);
	assert.equal(s.hands[2].length, 28);
	assert.equal(s.hands[0].length, 25);
	assert.equal(s.phase, 'discard');
	assert.deepEqual(s.toAct, [2]);
});

test('packet rounds with the a_monte windows: 5, then 10, then 10 (the dealer takes his three with the last)', () => {
	const game = load('venticinque_3', 3);
	const h = newHand(game, { seed: 'pk', dealer: 1 });
	const counts = () => h.s.hands.map((x) => x.length);
	assert.equal(h.s.phase, 'a_monte');
	assert.deepEqual(counts(), [5, 5, 5]);
	assert.deepEqual(h.toAct(), [2], 'the window opens at the right of the dealer');
	assert.deepEqual(h.legal(2).map((a) => a.type), ['a_monte_propose', 'a_monte_pass']);
	assert.deepEqual(h.legal(0), []);
	assert.equal(h.view(2).hand.length, 5);
	assert.equal(h.view(2).aMonte.stage, 'ask');
	for (const seat of [2, 0, 1]) { assert.deepEqual(h.toAct(), [seat]); assert.ok(h.apply(seat, { type: 'a_monte_pass' }).ok); }
	assert.deepEqual(counts(), [15, 15, 15]);
	assert.equal(h.s.phase, 'a_monte');
	for (const seat of [2, 0, 1]) h.apply(seat, { type: 'a_monte_pass' });
	assert.deepEqual(counts(), [25, 28, 25]);
	assert.equal(h.s.phase, 'a_monte', 'a window after the last packet too');
	for (const seat of [2, 0, 1]) h.apply(seat, { type: 'a_monte_pass' });
	assert.deepEqual(counts(), [25, 28, 25]);
	assert.equal(h.s.phase, 'discard');
	assert.equal(h.s.rest.length, 0);
	assert.deepEqual(h.s.packets, [5, 10, 10]);
});

test('a monte: a proposal and unanimous consent redeal; one refusal closes the window', () => {
	const game = load('venticinque_3', 3);
	const h = newHand(game, { seed: 'am', dealer: 0 });
	const before = h.s.hands.map((x) => x.join());
	assert.ok(h.apply(1, { type: 'a_monte_propose' }).ok);
	assert.deepEqual(h.toAct().sort(), [0, 2], 'the others vote together');
	assert.deepEqual(h.legal(0).map((a) => a.type), ['a_monte_agree', 'a_monte_refuse']);
	assert.deepEqual(h.legal(1), []);
	assert.ok(h.apply(0, { type: 'a_monte_agree' }).ok);
	assert.deepEqual(h.toAct(), [2]);
	const r = h.apply(2, { type: 'a_monte_agree' });
	assert.ok(r.ok);
	assert.ok(r.events.some((e) => e.e === 'a_monte' && e.result === 'redeal'));
	assert.equal(h.s.aCount, 1);
	assert.deepEqual(h.s.hands.map((x) => x.length), [5, 5, 5], 'dealt again, from the first packet');
	assert.notDeepEqual(h.s.hands.map((x) => x.join()), before);
	assert.equal(h.s.phase, 'a_monte');
	// a refusal
	assert.ok(h.apply(1, { type: 'a_monte_propose' }).ok);
	h.apply(0, { type: 'a_monte_agree' });
	const q = h.apply(2, { type: 'a_monte_refuse' });
	assert.ok(q.ok);
	assert.equal(h.s.aCount, 1);
	assert.deepEqual(h.s.hands.map((x) => x.length), [15, 15, 15], 'the deal goes on');
	assert.equal(h.view(0).aMonte.redeals, 1);
});

test('the redeal uses the hand seed plus /a and the count: replaying the log gives the same hand', async () => {
	const { replayHand, makeRng } = await import('../../core/index.js');
	const game = load('venticinque_3', 3);
	const h = newHand(game, { seed: 'rp', dealer: 2 });
	h.apply(0, { type: 'a_monte_propose' });
	h.apply(1, { type: 'a_monte_agree' });
	h.apply(2, { type: 'a_monte_agree' });
	const rng = makeRng('go');
	while (!h.isOver()) { const seat = h.toAct()[0]; const a = h.legal(seat); h.apply(seat, a[rng.int(a.length)]); }
	const back = replayHand(game, { seed: 'rp', dealer: 2 }, h.log);
	assert.equal(back.checksum(), h.checksum());
	assert.throws(() => replayHand(game, { seed: 'rp', dealer: 2 }, [{ seat: 0, action: { type: 'play', card: 'T1' } }]));
});
