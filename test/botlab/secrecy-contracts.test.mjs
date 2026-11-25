// What the secrecy check knows about contracts: laid cards, called cards, exposed cards, the secret partner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { leaks, publicFrom, seatLeaks, withoutCallables } from '../lib/secrecy.mjs';

const snap = {
	hands: { 0: ['T2'], 1: ['T3', 'T6'], 2: ['T4'] },
	discard: {}, rest: [], stock: [], declarer: 0,
	state: { exchange: { laid: ['T9'], called: ['T6'], gave: { 1: ['T7'] } }, declarations: { made: [{ seat: 1, kind: 'x', cards: ['T3'] }] } },
	secret: { card: 'swords:K', holder: 1 },
};

test('laid cards belong to the declarer; a holder knows what he gave', () => {
	assert.deepEqual(leaks(snap, new Set(), 2, { laid: ['T9'] }), ['T9']);
	assert.deepEqual(leaks(snap, new Set(), 0, { laid: ['T9'] }), []);
	assert.deepEqual(leaks(snap, new Set(), 1, { gave: ['T7'] }), []);
});

test('public from the ground truth: called names, exposed declarations, the called King', () => {
	assert.deepEqual([...publicFrom(snap)].sort(), ['T3', 'T6', 'swords:K']);
});

test('the cards a seat may call are not a leak, other cards in the legal list are', () => {
	const view = { legal: [{ type: 'call', card: 'T3' }, { type: 'play', card: 'T3' }] };
	assert.equal(withoutCallables({ t: 'view', view }).view.legal.length, 1);
	assert.deepEqual(leaks(snap, new Set(), 0, { t: 'view', view: { legal: [{ type: 'call_partner', card: 'T4' }] } }), []);
	assert.deepEqual(leaks(snap, new Set(), 0, { t: 'view', view: { legal: [{ type: 'play', card: 'T4' }] } }), ['T4']);
});

test('the secret partner: only the holder sees himself; a declarer who called his own card is known', () => {
	const view = (partner, side) => ({ t: 'view', view: { call: { partner }, sides: { of: { 1: side } } } });
	assert.deepEqual(seatLeaks(snap, 0, view(1, 0)), ['call.partner', 'sides.of[holder]']);
	assert.deepEqual(seatLeaks(snap, 0, view(null, null)), []);
	assert.deepEqual(seatLeaks(snap, 1, view(1, 0)), []);
	assert.deepEqual(seatLeaks({ ...snap, declarer: 1 }, 0, view(1, 0)), []);
	assert.deepEqual(seatLeaks({ ...snap, secret: null }, 0, view(1, 0)), []);
});
