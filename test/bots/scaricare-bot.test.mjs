// Bots in Sedici for three, «a scaricare»: the two who play on after the first «fuora» finish the hand without error, answer from
// the legal list, and say «fuora» when they can. Hands of the easy level (fast); the long runs of the other levels are a script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, newHand } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { getFile, level } from './lib.mjs';

const game = loadGame('sedici_3', getFile, { seats: 3, variant: 'a_scaricare' });

test('twenty hands of the easy bot end, each with a first to go out, and the seat that is out is never asked', () => {
	let seconds = 0;
	for (let i = 0; i < 20; i++) {
		const h = newHand(game, { seed: 'sbot' + i, dealer: i % 3 });
		let guard = 0;
		while (!h.isOver()) {
			assert.ok(guard++ < 4000, 'the hand does not end');
			const seat = h.toAct()[0];
			assert.ok(!h.outSeats().includes(seat), 'a seat that is out was asked');
			const view = h.view(seat);
			const { action } = chooseAction({ game, view, level: level('easy'), seed: `s${i}:${guard}` });
			assert.ok(view.legal.some((a) => a.type === action.type && a.card === action.card), 'the answer is not legal');
			assert.ok(h.apply(seat, action).ok);
		}
		const res = h.result();
		assert.equal(res.winners.length, 1);
		if (res.order && res.order.length === 3) seconds++;
	}
	assert.ok(seconds > 0, 'some hands end with a second «fuora»');
});
