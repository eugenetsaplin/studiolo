// Going out (fuora) in Sedici and Trent'uno: the claim window, a valid claim, the false-claim rows, the pack running
// out, live points, the secrecy of the view, the replay of every log.
import test from 'node:test';
import assert from 'node:assert/strict';
import { replayHand, newHand } from '../../core/index.js';
import { build, checkConserved, loadPatched } from './helpers.js';
import { load, livePoints, scene, giveWon, playFirstTrick, playOut, claimWhenRight, makeRng, valueOf, targetOf } from './race-helpers.js';

const sedici = load('sedici_2', 2);
const trentuno = load('trentuno', 2);
// the same games with a target nobody reaches: the only claims are false ones, and the play is never cut short
const far = (id) => loadPatched(id, 2, (f) => { f.hand.phases.find((p) => p.id === 'fuora').settings.target.value = 999; });
const sediciFar = far('sedici_2');
const trentunoFar = far('trentuno');

const claimOf = (h, seat) => h.legal(seat).filter((a) => a.type === 'claim_fuora');

// the first trick of the scene is taken by seat 1; its value is part of `pre`
function sceneAfterTrick(game, pre) {
	const lead = 'swords:5';
	const answer = 'swords:2';
	const h = scene(game, lead, answer);
	const trickValue = valueOf(game, lead) + valueOf(game, answer);
	giveWon(h, 1, pre - trickValue);
	playFirstTrick(h, lead, answer);
	assert.equal(livePoints(h, 1), pre);
	return h;
}

// revision 9: the file says own_turn; the window «right after a trick, by its taker» is the alt after_trick, patched in here
const sediciAfterTrick = loadPatched('sedici_2', 2, (f) => { f.hand.phases.find((p) => p.id === 'fuora').settings.claim_when.value = 'after_trick'; });
test('after_trick (the alt): the claim is offered only to the seat that took the trick, and only right after it', () => {
	const h = scene(sediciAfterTrick, 'swords:5', 'swords:2');
	assert.deepEqual(claimOf(h, 1), [], 'nobody has taken a trick yet');
	assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.deepEqual(claimOf(h, 0), [], 'the answer comes first');
	assert.ok(h.apply(0, { type: 'play', card: 'swords:2' }).ok);
	assert.deepEqual(h.toAct(), [1]);
	assert.deepEqual(claimOf(h, 1), [{ type: 'claim_fuora' }]);
	assert.deepEqual(claimOf(h, 0), []);
	assert.equal(h.apply(0, { type: 'claim_fuora' }).code, 'not_to_act');
	// the taker plays a card instead: the window is closed
	const card = h.legal(1).find((a) => a.type === 'play').card;
	assert.ok(h.apply(1, { type: 'play', card }).ok);
	assert.equal(h.view(1).fuora.canClaim, false);
	assert.deepEqual(claimOf(h, 1), []);
});

test('a valid claim ends the partita: the claimer wins one game point and is paid the simple stake', () => {
	for (const game of [sedici, trentuno]) {
		const target = targetOf(game);
		const h = sceneAfterTrick(game, target + 2);
		assert.equal(h.view(1).fuora.canClaim, true);
		const r = h.apply(1, { type: 'claim_fuora' });
		assert.ok(r.ok);
		const ev = r.events.find((e) => e.e === 'fuora_claimed');
		assert.deepEqual(ev, { e: 'fuora_claimed', seat: 1, valid: true, points: target + 2 });
		assert.ok(h.isOver());
		const res = h.result();
		assert.deepEqual(res.winners, [1]);
		assert.equal(res.reason, 'fuora');
		assert.equal(res.outcome, 'win');
		assert.deepEqual(res.gamePoints, { 0: 0, 1: 1 });
		assert.equal(res.payments.length, 1);
		assert.equal(res.payments[0].from, 0);
		assert.equal(res.payments[0].to, 1);
		assert.equal(res.payments[0].amount, 1);
		assert.equal(res.points[1] / 12, target + 2);
		checkConserved(h);
	}
});

test('a claim with exactly the target points is valid', () => {
	const h = sceneAfterTrick(sedici, 16);
	assert.ok(h.apply(1, { type: 'claim_fuora' }).ok);
	assert.deepEqual(h.result().winners, [1]);
});

// the false-claim rows: stake and game points by the claimer's real points
const ROWS = [
	[sedici, 7, 2, 2], [sedici, 8, 1, 1], [sedici, 9, 1, 1],
	[trentuno, 15, 2, 2], [trentuno, 16, 1, 1],
];
for (const [game0, pts, amount, gp] of ROWS) {
	const game = game0 === sedici ? sediciFar : trentunoFar;
	test(`${game.id}: a false claim with ${pts} points pays ${amount} and gives the other seat ${gp} game point(s); play goes on`, () => {
		const h = sceneAfterTrick(game, pts);
		const r = h.apply(1, { type: 'claim_fuora' });
		assert.ok(r.ok);
		assert.deepEqual(r.events.find((e) => e.e === 'fuora_claimed'), { e: 'fuora_claimed', seat: 1, valid: false, points: pts });
		assert.ok(!h.isOver(), 'play goes on');
		assert.deepEqual(h.toAct(), [1]);
		assert.deepEqual(claimOf(h, 1), [], 'one claim at a time');
		assert.deepEqual(h.view(0).fuora.claims, [{ seat: 1, valid: false, points: pts }]);
		// play to the end of the pack with no further claim: nobody wins, the false claim is still paid
		playOut(h, makeRng('rest'));
		const res = h.result();
		assert.equal(res.reason, 'stock_empty');
		assert.equal(res.outcome, 'none');
		assert.deepEqual(res.winners, []);
		assert.deepEqual(res.payments, [{ from: 1, to: 0, amount, why: 'false_claim' }]);
		assert.deepEqual(res.gamePoints, { 0: gp, 1: 0 });
	});
}

test('after_false_claim hand_ends: a false claim loses the partita and the other seat wins', () => {
	const game = load('sedici_2', 2, { alts: ['hand.phases[fuora].settings.after_false_claim'] });
	const h = sceneAfterTrick(game, 7);
	assert.ok(h.apply(1, { type: 'claim_fuora' }).ok);
	assert.ok(h.isOver());
	const res = h.result();
	assert.deepEqual(res.winners, [0]);
	assert.equal(res.reason, 'false_claim');
	assert.deepEqual(res.gamePoints, { 0: 1, 1: 0 });
});

test('the pack runs out: no winner, no game point, no payment', () => {
	for (const game of [sediciFar, trentunoFar]) {
		const h = playOut(newHand(game, { seed: 'run', dealer: 0 }), makeRng('run'));
		const res = h.result();
		assert.equal(res.outcome, 'none');
		assert.deepEqual(res.winners, []);
		assert.equal(res.reason, 'stock_empty');
		assert.deepEqual(res.payments, []);
		assert.deepEqual(res.gamePoints, { 0: 0, 1: 0 });
		assert.ok(h.s.stockEmpty);
		checkConserved(h);
	}
	const h = playOut(newHand(sediciFar, { seed: 'run', dealer: 0 }), makeRng('run'));
	assert.equal(h.s.round, 8, 'nine rounds of eight cards: 72 of 78 cards');
	assert.equal(h.s.rest.length, 6);
});

test('the claim window after the last trick of a round: only a right claim, before the next deal', () => {
	for (const claimNow of [true, false]) {
		const h = newHand(sedici, { seed: 'w' + claimNow, dealer: 0 });
		const rng = makeRng('win');
		const playOne = () => {
			const seat = h.toAct()[0];
			const a = h.legal(seat).filter((x) => x.type === 'play');
			assert.ok(h.apply(seat, a[rng.int(a.length)]).ok);
		};
		for (let i = 0; i < 6; i++) playOne();
		if (claimNow) { giveWon(h, 0, 16); giveWon(h, 1, 18); }
		playOne();
		playOne();
		if (claimNow) {
			assert.equal(h.s.round, 0, 'the next deal waits');
			const taker = h.toAct()[0];
			assert.deepEqual(h.legal(taker), [{ type: 'claim_fuora' }]);
			assert.ok(h.apply(taker, { type: 'claim_fuora' }).ok);
			assert.ok(h.isOver());
			assert.deepEqual(h.result().winners, [taker]);
		} else {
			assert.equal(h.s.round, 1, 'nobody can claim: the next round is dealt');
			assert.equal(h.s.hands[0].length, 4);
			assert.equal(h.view(0).round.index, 1);
			assert.equal(h.view(0).round.stock, 62);
		}
	}
});

test('live points: view.points.mine is the count of the won cards at every step and equals the final count', () => {
	for (const game of [sedici, trentuno]) {
		for (let i = 0; i < 6; i++) {
			const h = newHand(game, { seed: 'lp' + i, dealer: i % 2 });
			const rng = makeRng('lp' + i);
			while (!h.isOver()) {
				for (const q of [0, 1]) assert.equal(h.view(q).points.mine, livePoints(h, q));
				const seat = h.toAct()[0];
				const legal = h.legal(seat);
				const claim = legal.find((a) => a.type === 'claim_fuora');
				const plays = legal.filter((a) => a.type === 'play');
				const a = claim && claimWhenRight(h, seat) ? claim : plays.length ? plays[rng.int(plays.length)] : claim;
				assert.ok(h.apply(seat, a).ok);
			}
			for (const q of [0, 1]) assert.equal(h.view(q).points.mine, h.result().points[q] / 12);
		}
	}
});

test('the view of a seat does not depend on the other hand or the order of the pack', () => {
	const mk = (otherHand, restReverse) => {
		const mine = ['swords:5', 'cups:3', 'T7', 'coins:K'];
		const p = build([4, 4], [otherHand, mine]);
		if (restReverse) p.rest = p.rest.slice().reverse();
		return newHand(sedici, { seed: 'sec', dealer: 0, preset: p });
	};
	const a = mk(['T3', 'T4', 'batons:9', 'batons:2'], false);
	const b = mk(['T9', 'T10', 'cups:9', 'swords:9'], true);
	for (const h of [a, b]) assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.deepEqual(a.view(1), b.view(1));
	assert.notEqual(JSON.stringify(a.view(0).hand), JSON.stringify(b.view(0).hand));
	assert.deepEqual(a.view(1).handCounts, b.view(1).handCounts);
	assert.equal(JSON.stringify(a.view(1)).includes('T3'), false);
});

test('every log replays to the same hand, the claims included', () => {
	for (const game of [sedici, trentuno]) {
		for (let i = 0; i < 25; i++) {
			const init = { seed: 'rp' + i, dealer: i % 2 };
			const h = playOut(newHand(game, init), makeRng('rp' + i), (hh, seat) => claimWhenRight(hh, seat) || hh.s.round === 2);
			const again = replayHand(game, init, h.log);
			assert.equal(again.checksum(), h.checksum());
			assert.deepEqual(again.result(), h.result());
		}
	}
});
