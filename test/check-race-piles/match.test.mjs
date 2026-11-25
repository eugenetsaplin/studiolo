// Independent check of the race and piles games: whole matches: the race to five of Sedici and Trent'uno, the ledger of Baronetti.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, newMatch, playOut, makeRng, rightClaim } from './lib.mjs';

const fcPoints = (h) => {
	const out = { 0: 0, 1: 0 };
	for (const c of (h.s.m.fuora && h.s.m.fuora.claims) || []) {
		if (c.valid) continue;
		const p = c.stake === 'marcia' || c.stake === 'double' ? 2 : 1;
		out[1 - c.seat] += p;
	}
	return out;
};

for (const id of ['sedici_2', 'trentuno']) {
	test(`${id}: a race to 5: hand game points = 1 to the winner + false-claim points; no winner scores nothing; the dealer by the rotation; the right winner`, () => {
		const g = load(id);
		assert.equal(g.cfg.match.kind, 'race');
		assert.equal(g.cfg.match.target, 5);
		let matches = 0;
		let falseSeen = 0;
		for (let m = 0; m < 40; m++) {
			const match = newMatch(g, { seed: 'race' + m });
			const rng = makeRng('race' + m);
			let guard = 0;
			for (;;) {
				const h = match.hand;
				const dealer = h.s.dealer;
				playOut(h, rng, { claimOk: rightClaim, falseRate: 0.15 });
				const r = h.result();
				const fc = fcPoints(h);
				if (fc[0] + fc[1]) falseSeen++;
				for (const q of [0, 1]) assert.equal(r.gamePoints[q], (r.winners.includes(q) ? 1 : 0) + fc[q], 'game points of the hand');
				if (!r.winners.length) assert.equal(r.outcome, 'none');
				if (match.isOver()) break;
				const next = match.next();
				// the rotation the file names: winner_passes_to_companion (the loser deals) or right (the deal alternates)
				const rot = g.cfg.seats.dealer_rotation;
				const want = rot === 'winner_passes_to_companion' && r.winners.length ? 1 - r.winners[0] : 1 - dealer;
				assert.equal(next.s.dealer, want, 'the next dealer by seats.dealer_rotation; with no winner the dealer moves on');
				assert.ok(guard++ < 80);
			}
			const st = match.standing();
			const gp = st.gamePoints;
			assert.ok(Math.max(gp[0], gp[1]) >= 5, 'somebody reached five');
			// level leaders at the target play on (revision 6): a race never ends level
			assert.notEqual(gp[0], gp[1], 'a race does not end level');
			assert.deepEqual(st.winners, [gp[0] > gp[1] ? 0 : 1]);
			matches++;
		}
		assert.equal(matches, 40);
		assert.ok(falseSeen > 0, 'false claims were played');
	});
}

// rules revision 9 (answer 2): for two the players deal in turn (dealer_rotation alternate; rule 44, pp. 42-43, p. 70, p. 53);
// the match is still two partite (one round of dealers = rounds x seats hands)
test('baronetti: a ledger match ends after two partite; the players deal in turn; the balance decides', () => {
	const g = load('baronetti');
	assert.equal(g.cfg.match.kind, 'ledger');
	assert.equal(g.cfg.match.dealer_rounds, 1);
	for (let m = 0; m < 20; m++) {
		const match = newMatch(g, { seed: 'led' + m });
		const rng = makeRng('led' + m);
		const dealers = [];
		const firstWinners = [];
		let n = 0;
		for (;;) {
			dealers.push(match.hand.s.dealer);
			playOut(match.hand, rng, { pShow: 0.5 });
			if (n === 0) firstWinners.push(...(match.hand.result().winners || []));
			n++;
			if (match.isOver()) break;
			match.next();
			assert.ok(n < 3);
		}
		assert.equal(n, 2);
		assert.equal(g.cfg.seats.dealer_rotation, 'alternate');
		assert.equal(dealers[1], 1 - dealers[0], 'the other player deals the second partita');
		const st = match.standing();
		if (st.ledger[0] !== st.ledger[1]) assert.deepEqual(st.winners, [st.ledger[0] > st.ledger[1] ? 0 : 1]);
		else assert.deepEqual(st.winners, []);
	}
});

// Two players: Sedici p. 41 hands the pack to the «companion»; the Trent'uno file itself says p. 41 is said for two players
// revision 9 (answer 2): the players deal in turn, as at Sedici
test('trentuno at 2 seats: the players deal in turn, as at Sedici (answer 2)', () => {
	const g = load('trentuno');
	assert.equal(g.cfg.seats.dealer_rotation, 'alternate');
});
