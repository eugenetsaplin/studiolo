// Helpers for the independent checks of the contract games. Reads the game files through the core test helpers; never writes a file.
import assert from 'node:assert/strict';
import { load } from '../core/helpers.js';
import { makeRng } from '../../core/index.js';

export { load };

// the contract pairs that are playable
export const NEW_PAIRS = [
	['sedici_3', 3], ['sedici_4', 4], ['trentuno', 3], ['trentuno', 4], ['mitigati_2', 2], ['bagattultimo', 3],
	['chiamare_il_re', 4], ['permesso_3', 3], ['permesso_4', 4], ['permesso_5', 5], ['permesso_6', 6], ['permesso_7', 7],
];

// a random legal action of a random seat to act, until the predicate holds or the hand ends
export function step(h, rng) {
	const toAct = h.toAct();
	assert.ok(toAct.length, 'nobody to act in a hand that is not over');
	const seat = toAct[rng.int(toAct.length)];
	const legal = h.legal(seat);
	assert.ok(legal.length, 'no legal action');
	const a = legal[rng.int(legal.length)];
	const r = h.apply(seat, a);
	assert.ok(r.ok, 'legal action refused ' + JSON.stringify(a));
	return { seat, a, r };
}

export function playUntil(h, pred, rngSeed = 'v') {
	const rng = makeRng(rngSeed);
	let guard = 0;
	while (!h.isOver() && !pred(h)) {
		if (guard++ > 20000) throw new Error('the hand does not end');
		step(h, rng);
	}
	return h;
}

// act as `seat` with exactly this action type (and card)
export function act(h, seat, type, card) {
	assert.deepEqual(h.toAct(), [seat], 'whose turn for ' + type);
	const a = card ? { type, card } : { type };
	const r = h.apply(seat, a);
	assert.ok(r.ok, type + ' refused: ' + JSON.stringify(r) + ' legal ' + JSON.stringify(h.legal(seat)));
	return r;
}

export const types = (h, seat) => h.legal(seat).map((a) => a.type);
