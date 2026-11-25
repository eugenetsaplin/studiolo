// Independent check of the race and piles games: replay and determinism. REPLAY_HANDS=2000 runs the full count.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, newHand, replayHand, makeRng, playOut, rightClaim, NEW } from './lib.mjs';

const N = Number(process.env.REPLAY_HANDS || 100);

for (const [id, seats] of NEW) {
	test(`${id}: ${N} random partite replay to the same checksum; the same seed deals the same partita`, () => {
		const g = load(id, seats);
		for (let i = 0; i < N; i++) {
			const init = { seed: 'rp' + i, dealer: i % seats };
			const h = playOut(newHand(g, init), makeRng('rp' + i), { claimOk: rightClaim, falseRate: 0.1, pShow: 0.5 });
			const again = replayHand(g, init, h.log);
			assert.equal(again.checksum(), h.checksum(), 'replay of ' + i);
			const twin = newHand(g, init);
			assert.equal(twin.checksum(), newHand(g, init).checksum());
			assert.equal(JSON.stringify(twin.s.hands), JSON.stringify(replayHand(g, init, []).s.hands));
		}
	});
}
