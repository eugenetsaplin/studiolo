// The match of the going-out games: a race to five game points (Sedici, Trent'uno), the same games as a ledger of
// partite (the other reading), a ledger match of two partite (Baronetti). A partita is one hand, whatever its rounds.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newMatch } from '../../core/index.js';
import { loadPatched } from './helpers.js';
import { load, playOut, claimWhenRight, makeRng } from './race-helpers.js';
import { falseClaimPoints } from '../../core/modules/fuora.js';

const sedici = load('sedici_2', 2);
const trentuno = load('trentuno', 2);
const far = (id) => loadPatched(id, 2, (f) => { f.hand.phases.find((p) => p.id === 'fuora').settings.target.value = 999; });

// plays a whole match; `claim(handIndex)` gives the claiming policy of a hand; returns the match and the dealers
function runMatch(game, seed, claim) {
	const m = newMatch(game, { seed, firstDealer: 0 });
	const rng = makeRng('m' + seed);
	const dealers = [];
	for (let i = 0; i < 200; i++) {
		dealers.push(m.hand.s.dealer);
		playOut(m.hand, rng, claim(m.handIndex));
		if (m.isOver()) break;
		m.next();
	}
	return { m, dealers };
}

// what a hand should score: one for the winner, and the false-claim points of the others
function expectedGamePoints(game, h) {
	const out = { 0: 0, 1: 0 };
	for (const q of h.result().winners) out[q] += 1;
	for (const c of h.s.m.fuora.claims) {
		if (c.valid || !c.stake) continue;
		for (const q of [0, 1]) if (q !== c.seat) out[q] += falseClaimPoints(c.stake);
	}
	return out;
}

for (const game of [sedici, trentuno]) {
	test(`${game.id}: a race to five: somebody reaches the target, the winner is right, the false-claim points count`, () => {
		assert.equal(game.cfg.match.kind, 'race');
		assert.equal(game.cfg.match.target, 5);
		let falseSeen = 0;
		for (let i = 0; i < 6; i++) {
			// every hand: the policy claims when right, and at round 1 it claims whatever it has (often falsely), once a hand
			// (revision 9: at own_turn a claim is possible at every turn, a claim at each of them would pass the target in one hand)
			const { m } = runMatch(game, 'race' + i, () => (h, seat) => claimWhenRight(h, seat) || (h.s.round === 1 && !(h.s.m.fuora && h.s.m.fuora.claims.length)));
			assert.ok(m.isOver());
			const st = m.standing();
			for (const r of st.hands) falseSeen += 0 + (r.payments.some((p) => p.why === 'false_claim') ? 1 : 0);
			// the sums of the hands are the standing
			const sum = { 0: 0, 1: 0 };
			for (const r of st.hands) for (const q of [0, 1]) sum[q] += r.gamePoints[q];
			assert.deepEqual(st.gamePoints, sum);
			const top = Math.max(sum[0], sum[1]);
			assert.ok(top >= 5, 'the race ends at five');
			// the race ends at the first hand after which a seat has the target AND one side leads alone: not before (a lead at the
			// target is the end), and not later (level leaders at the target play on, but one hand more than needed is never dealt)
			const decided = (gp) => Math.max(gp[0], gp[1]) >= 5 && gp[0] !== gp[1];
			const run = { 0: 0, 1: 0 };
			st.hands.forEach((r, k) => {
				for (const q of [0, 1]) run[q] += r.gamePoints[q];
				if (k < st.hands.length - 1) assert.ok(!decided(run), `the race was decided after hand ${k + 1} of ${st.hands.length} and dealt on`);
				else assert.ok(decided(run), 'the last hand decides the race');
			});
			assert.notEqual(sum[0], sum[1], 'a race does not end level');
			assert.deepEqual(st.winners, [sum[0] > sum[1] ? 0 : 1]);
		}
		assert.ok(falseSeen > 0, 'the scenes include false claims');
	});

	test(`${game.id}: each hand scores one for the winner plus its false-claim points; the dealer moves by the file's rotation`, () => {
		const m = newMatch(game, { seed: 'score', firstDealer: 0 });
		const rng = makeRng('score');
		const seen = new Set();
		for (let i = 0; i < 4 && !m.isOver(); i++) {
			const dealer = m.hand.s.dealer;
			playOut(m.hand, rng, () => (h, seat) => claimWhenRight(h, seat) || h.s.round === 1);
			const r = m.hand.result();
			assert.deepEqual(r.gamePoints, expectedGamePoints(game, m.hand));
			if (m.isOver()) break;
			m.next();
			if (game.cfg.seats.dealer_rotation === 'winner_passes_to_companion') {
				assert.equal(m.hand.s.dealer, (r.winners[0] + 1) % 2, 'the winner passes the pack to his companion');
				seen.add(r.winners[0]);
			} else assert.equal(m.hand.s.dealer, (dealer + 1) % 2);
		}
	});

	test(`${game.id}: a partita with no winner has the outcome none, scores nothing and is not dealt again by the same dealer`, () => {
		const g = far(game.id);
		const m = newMatch(g, { seed: 'none', firstDealer: 0 });
		const rng = makeRng('none');
		const dealers = [];
		for (let i = 0; i < 3; i++) {
			dealers.push(m.hand.s.dealer);
			playOut(m.hand, rng);
			const r = m.hand.result();
			assert.equal(r.outcome, 'none');
			assert.deepEqual(r.gamePoints, { 0: 0, 1: 0 });
			assert.ok(!m.isOver());
			m.next();
		}
		assert.deepEqual(dealers, [0, 1, 0], 'the dealer moves right, a race tie_replay does not apply');
		assert.deepEqual(m.standing().gamePoints, { 0: 0, 1: 0 });
	});
}

test('the other reading of the match: a ledger of one round of dealers, two partite, the greatest balance wins', () => {
	const g = loadPatched('sedici_2', 2, (f) => {
		f.match.kind.value = 'ledger';
		f.match.dealer_rounds = { value: 1, source: '[S] test' };
		delete f.match.target;
	});
	assert.equal(g.support.runnable, true);
	for (let i = 0; i < 5; i++) {
		const { m } = runMatch(g, 'led' + i, () => (h, seat) => claimWhenRight(h, seat));
		assert.ok(m.isOver());
		const st = m.standing();
		assert.equal(st.hands.length, 2, 'one hand is one partita, whatever its rounds');
		const bal = st.ledger;
		if (bal[0] === bal[1]) assert.deepEqual(st.winners, []);
		else assert.deepEqual(st.winners, [bal[0] > bal[1] ? 0 : 1]);
	}
});

test('a ledger match of two partite (Baronetti) ends with the right winner', () => {
	const g = load('baronetti', 2);
	assert.equal(g.cfg.match.kind, 'ledger');
	for (let i = 0; i < 5; i++) {
		const m = newMatch(g, { seed: 'bar' + i, firstDealer: 0 });
		const rng = makeRng('bar' + i);
		let hands = 0;
		for (;;) {
			playOut(m.hand, rng);
			hands++;
			if (m.isOver()) break;
			m.next();
		}
		assert.equal(hands, 2 * g.cfg.match.dealer_rounds);
		const st = m.standing();
		const bal = st.ledger;
		if (bal[0] === bal[1]) assert.deepEqual(st.winners, []);
		else assert.deepEqual(st.winners, [bal[0] > bal[1] ? 0 : 1]);
	}
});

// a match whose earlier hands scored `before` and whose last hand, over, scored `last`
function standingAt(game, before, last) {
	const m = newMatch(game, { seed: 'level', firstDealer: 0 });
	const hand = (gamePoints) => ({ gamePoints, points: { 0: 0, 1: 0 }, payments: [], winners: [] });
	m.done = before.map(hand);
	m.hand = { isOver: () => true, result: () => hand(last) };
	return m;
}

for (const game of [sedici, trentuno]) {
	test(`${game.id}: level leaders at the target play on; one side ahead ends the race`, () => {
		const m = standingAt(game, [{ 0: 4, 1: 5 }], { 0: 1, 1: 0 });
		assert.equal(m.isOver(), false, '5:5 goes on');
		assert.equal(m.standing().winners, null);
		const m2 = standingAt(game, [{ 0: 4, 1: 5 }], { 0: 2, 1: 0 });
		assert.equal(m2.isOver(), true, '6:5 ends');
		assert.deepEqual(m2.standing().winners, [0]);
		const m3 = standingAt(game, [{ 0: 5, 1: 5 }], { 0: 0, 1: 1 });
		assert.equal(m3.isOver(), true);
		assert.deepEqual(m3.standing().winners, [1]);
		const m4 = standingAt(game, [{ 0: 2, 1: 3 }], { 0: 1, 1: 0 });
		assert.equal(m4.isOver(), false, 'below the target: nothing changes');
	});

	test(`${game.id}: max_hands ends a level race with no winner`, () => {
		const m = standingAt(game, [], { 0: 0, 1: 0 });
		const cap = m.mc.max_hands || 60;
		const hand = (gamePoints) => ({ gamePoints, points: { 0: 0, 1: 0 }, payments: [], winners: [] });
		m.done = Array.from({ length: cap - 1 }, (_, i) => hand(i === 0 ? { 0: 5, 1: 5 } : { 0: 0, 1: 0 }));
		assert.equal(m.isOver(), true);
		assert.deepEqual(m.standing().winners, []);
	});
}
