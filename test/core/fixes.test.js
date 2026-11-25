// Fixes after an independent check of the core: pair matches, short presets, dealer_choice snapshots, view() range, Support of views.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, newMatch, makeRng, checkSupport, DECK } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { load } from './helpers.js';

test('a pair match is won by a side, not tied by its two equal seats', () => {
	const g = load('partita_4', 4, { variant: 'four_deals' });
	const wins = [];
	for (let k = 0; k < 6; k++) {
		const m = newMatch(g, { seed: 'fa' + k, firstDealer: 0 });
		const rng = makeRng('bot' + k);
		for (;;) {
			while (!m.hand.isOver()) {
				const seat = m.hand.toAct()[0];
				assert.ok(m.hand.apply(seat, chooseAction(m.hand.legal(seat), rng)).ok);
			}
			if (m.isOver()) break;
			m.next();
		}
		const w = m.standing().winners;
		if (w.length) { assert.equal(w.length, 2); assert.equal(w[1] - w[0], 2); }
		wins.push(w.length);
	}
	assert.ok(wins.some((n) => n === 2), 'at least one of six matches has a winning pair');
});

test('a preset with a seat short of cards is refused', () => {
	const g = load('venticinque', 2);
	const h = newHand(g, { seed: 'p', dealer: 0 });
	assert.ok(h);
	const snap = newHand(g, { seed: 'p', dealer: 0 }).snapshot();
	const rest = snap.rest.slice();
	const ok = { hands: { 0: snap.hands[0], 1: snap.hands[1] }, rest };
	assert.doesNotThrow(() => newHand(g, { seed: 'x', dealer: 0, preset: ok }));
	const short = { hands: { 0: snap.hands[0].slice(1), 1: snap.hands[1] }, rest: [snap.hands[0][0], ...rest] };
	assert.throws(() => newHand(g, { seed: 'x', dealer: 0, preset: short }), /fewer cards/);
});

test('the snapshot records the packets as dealt, also for dealer_choice', () => {
	const g = load('partita_4', 4);
	const h = newHand(g, { seed: 'k', dealer: 1 });
	assert.ok(h.snapshot().packets.length >= 1);
	assert.ok(h.snapshot().packets.every((x) => Number.isInteger(x) && x > 0));
});

test('view() with a seat outside 0..n-1 throws a RangeError', () => {
	const h = newHand(load('venticinque', 2), { seed: 'v', dealer: 0 });
	for (const bad of [-1, 2, 1.5, '0', null, undefined]) assert.throws(() => h.view(bad), RangeError);
	assert.ok(h.view(0));
	assert.equal(DECK.length, 78);
});

test('Support: a view reading the core does not play is listed', () => {
	const g = load('venticinque', 2);
	assert.equal(g.support.runnable, true);
	const rules = JSON.parse(JSON.stringify(g.rules));
	rules.view = { ...(rules.view || {}), piles: { ...((rules.view || {}).piles || {}), discard: 'all_after_hand' } };
	const sup = checkSupport(rules, 2);
	assert.equal(sup.runnable, false);
	assert.ok(sup.missing.some((m) => m.path === 'view.piles.discard'));
});
