// The checks of the robots must bite: each one is shown a fault and must find it. Also the census.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, newHand, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { conservation } from '../lib/invariants.mjs';
import { leaks } from '../lib/secrecy.mjs';
import { getFile, recountHand, hyperAtMost, exactFewTrumps, runCase } from '../../tools/robots.mjs';

function played(id, seats, seed) {
	const game = loadGame(id, getFile, { seats });
	const h = newHand(game, { seed, dealer: 0 });
	const rng = makeRng(seed + ':bot');
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		assert.ok(h.apply(seat, chooseAction(h.legal(seat), rng)).ok);
	}
	return { game, h, snap: h.snapshot(), result: h.result(), sidesOf: h.view(0).sides.of };
}

test('the recount agrees with the core, and finds a changed score', () => {
	for (const [id, seats] of [['venticinque', 2], ['partita_4', 4], ['venticinque_3', 3], ['morto', 2]]) {
		const { game, snap, result, sidesOf } = played(id, seats, 'rc');
		assert.deepEqual(recountHand(game, snap, result, sidesOf), [], id);
		const bad = structuredClone(result);
		bad.points[0] += 1;
		assert.ok(recountHand(game, snap, bad, sidesOf).length > 0, id);
	}
});

test('conservation finds a doubled and a missing card', () => {
	const { snap } = played('venticinque', 2, 'cv');
	assert.deepEqual(conservation(snap), []);
	const twice = structuredClone(snap);
	twice.won[0].push(twice.won[1][0]);
	assert.ok(conservation(twice).length > 0);
	const lost = structuredClone(snap);
	lost.won[0].pop();
	assert.ok(conservation(lost).length > 0);
});

test('the secrecy check finds the hand of another seat in a view', () => {
	const game = loadGame('partita_3', getFile, { seats: 3 });
	const h = newHand(game, { seed: 'sc', dealer: 0 });
	const snap = h.snapshot();
	const view = h.view(1);
	assert.deepEqual(leaks(snap, [], 1, view), []);
	view.spy = snap.hands[2][0];
	assert.deepEqual(leaks(snap, [], 1, view), [snap.hands[2][0]]);
});

test('an illegal action is refused and changes nothing (a whole hand of tries)', () => {
	const game = loadGame('partita_4', getFile, { seats: 4 });
	const h = newHand(game, { seed: 'il', dealer: 1 });
	const rng = makeRng('il:bot');
	let tried = 0;
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const keys = new Set(legal.map((a) => a.type + '/' + a.card));
		for (const card of ['swords:1', 'T0', 'T21', 'coins:K']) {
			if (legal[0].card === undefined || keys.has(legal[0].type + '/' + card)) continue;
			const before = h.checksum();
			assert.equal(h.apply(seat, { type: legal[0].type, card }).ok, false);
			assert.equal(h.checksum(), before);
			tried++;
		}
		assert.ok(h.apply(seat, chooseAction(legal, rng)).ok);
	}
	assert.ok(tried > 50);
});

test('the exact share of few trionfi', () => {
	assert.ok(Math.abs(hyperAtMost(4, 2, 2, 0) - 1 / 6) < 1e-9);
	assert.equal(hyperAtMost(4, 2, 2, 2), 1);
	const p = exactFewTrumps(28);
	assert.ok(p > 0.01 && p < 0.02, String(p)); // 28 cards of 78 hold 7.5 numbered trionfi on average
});

test('the census counts are consistent', () => {
	const row = runCase({ id: 'partita_4', seats: 4, deals: 300, seed: 'cen' });
	const c = row.census;
	assert.equal(c.hands, row.hands);
	assert.ok(c.dealer_no_trick <= c.seat_no_trick && c.discarder_no_trick <= c.seat_no_trick);
	assert.ok(c.fool_owner_no_plain_side <= c.fool_owner_no_plain_seat);
	assert.ok(c.fool_owner_no_other_side <= c.fool_owner_no_other_seat);
	assert.ok(c.fool_played <= c.hands && c.fool_led <= c.hands);
	assert.ok(c.seat_no_trick > 0, 'a seat with no trick does happen at four seats');
	assert.equal(c.discarder_all_barred, 0);
	assert.ok(row.info.dealerHandSize > row.info.barredMax, 'a hand longer than all barred cards can never be only barred');
});
