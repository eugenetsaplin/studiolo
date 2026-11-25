// Revision 10 of the core: result.tie share.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as result from '../../core/modules/result.js';
import * as settle from '../../core/modules/settle.js';

// a bare hand handle: the points of the seats (book points, one seat per side), `set` for the phase
export function fake(points, set, game = {}) {
	const n = points.length;
	const sp = {};
	const pts = {};
	points.forEach((p, i) => { sp[i] = Math.round(p * 12); pts[i] = Math.round(p * 12); });
	const sides = { of: points.map((_, i) => i) };
	const s = { n, declarer: null, contract: null, tricks: [], m: { count: { sidePoints: sp, points: pts, breakdown: {} } } };
	const h = { s, cur: { set }, game: { options: {}, plan: [], rules: {}, ...game }, sides: () => sides, contractById: () => null };
	return h;
}

function play(points, resultSet, settleSet = { mode: 'loser_pays_winner', amount: 1 }) {
	const h = fake(points, resultSet);
	result.enter(h);
	h.cur = { set: settleSet };
	settle.enter(h);
	return h.s.result;
}

const fewest = { winner: 'fewest_points', tie: 'share', game_points: 'none' };
const pays = (r) => r.payments.map((p) => `${p.from}>${p.to}:${p.amount}`).sort();

test('tie share: equal fewest points all win, the worst pays each of them', () => {
	const r = play([2, 2, 9], fewest);
	assert.equal(r.outcome, 'win');
	assert.deepEqual(r.winners, [0, 1]);
	assert.deepEqual(r.worst, [2]);
	assert.deepEqual(pays(r), ['2>0:1', '2>1:1']);
});

test('tie share: everybody level is still a tie, nobody pays', () => {
	const r = play([4, 4, 4], fewest);
	assert.equal(r.outcome, 'tie');
	assert.deepEqual(r.winners, []);
	assert.deepEqual(pays(r), []);
});

test('tie share: one winner and equal worst: both worst pay (loser_pays_winner takes r.worst)', () => {
	const r = play([0, 5, 5], fewest);
	assert.deepEqual(r.winners, [0]);
	assert.deepEqual(r.worst, [1, 2]);
	assert.deepEqual(pays(r), ['1>0:1', '2>0:1']);
});

test('tie share: four seats, two best, two worst', () => {
	const r = play([1, 1, 7, 7], fewest);
	assert.deepEqual(r.winners, [0, 1]);
	assert.deepEqual(r.worst, [2, 3]);
	assert.equal(r.payments.length, 4);
});

test('tie share works for more_points too; without share an equal best is a tie', () => {
	const m = { winner: 'more_points', tie: 'share', game_points: 'one' };
	const r = play([9, 9, 2], m);
	assert.deepEqual(r.winners, [0, 1]);
	assert.deepEqual(r.worst, [2]);
	assert.deepEqual(r.gamePoints, { 0: 1, 1: 1, 2: 0 });
	const t = play([9, 9, 2], { winner: 'more_points', tie: 'no_game_points', game_points: 'one' });
	assert.equal(t.outcome, 'tie');
	assert.deepEqual(t.winners, []);
	const u = play([2, 2, 9], { winner: 'fewest_points', game_points: 'none' });
	assert.equal(u.outcome, 'tie');
});

test('tie share is a value of the format', () => {
	assert.ok(result.supports.tie.includes('share'));
});

// the same on whole hands of Meno with the new values, as test data (rulesets/ is not touched)
import { loadPatched } from './helpers.js';
import { playHand } from './r9-lib.js';

test('tie share in played Meno hands: winners are exactly the fewest points, the worst pay each winner', () => {
	for (const seats of [3, 4, 6]) {
		const g = loadPatched('meno', seats, (f) => {
			const ph = (id) => f.hand.phases.find((p) => p.id === id);
			ph('result').settings.tie.value = 'share';
			ph('settle').settings.mode.value = 'loser_pays_winner';
		});
		assert.equal(g.support.runnable, true);
		let shared = 0;
		for (let i = 0; i < 60; i++) {
			const h = playHand(g, 'r10share' + seats + ':' + i);
			const r = h.result();
			const pts = Object.values(r.sidePoints);
			const best = Math.min(...pts);
			if (pts.every((p) => p === pts[0])) { assert.equal(r.outcome, 'tie'); assert.equal(r.payments.length, 0); continue; }
			assert.equal(r.outcome, 'win');
			const w = [...Array(seats).keys()].filter((q) => r.sidePoints[q] === best);
			assert.deepEqual(r.winners, w);
			if (w.length > 1) shared++;
			const worst = Math.max(...pts);
			const payers = [...Array(seats).keys()].filter((q) => r.sidePoints[q] === worst);
			assert.deepEqual(r.payments.map((p) => `${p.from}>${p.to}`).sort(), payers.flatMap((p) => w.map((x) => `${p}>${x}`)).sort());
		}
		if (seats === 6) assert.ok(shared > 0, 'shared wins occur on six seats');
	}
});

// ---- Y2: match.payout ----
import { newMatch } from '../../core/index.js';
import { makeRng } from '../../core/index.js';
import { playOut } from './race-helpers.js';

// a match whose earlier hands scored `before` and whose last hand, over, scored `last` (points per seat in twelfths)
function matchAt(game, hands) {
	const m = newMatch(game, { seed: 'r10payout', firstDealer: 0 });
	const hand = (points) => ({ gamePoints: Object.fromEntries(Object.keys(points).map((q) => [q, 0])), points, payments: [], winners: [], worst: [] });
	const all = hands.map(hand);
	m.done = all.slice(0, -1);
	m.hand = { isOver: () => true, result: () => all[all.length - 1], view: () => ({}) };
	return m;
}
const pairs = (p) => p.payments.map((x) => `${x.from}>${x.to}:${x.amount}`).sort();
// Partita for four, the variant «four deals». Since revision 10 the file itself pays at the end of the match (match.payout in the
// patch of the variant); `part` clears that, so a test starts from a game that pays by the deal, and the patch it is given
// writes `f.match.payout` into the patch.match of the variant, where the file keeps it.
const part = (patch) => loadPatched('partita_4', 4, (f) => {
	const v = f.variants.find((x) => x.id === 'four_deals');
	v.patch.match = v.patch.match || {};
	delete v.patch.match.payout;
	patch({ match: v.patch.match });
}, { variant: 'four_deals' });
const withPayout = (value) => part((f) => { f.match.payout = { value, source: '[S] test' }; });

test('payout match_end: Partita for four, 184.5 : 179.5 over four deals - the pair with 179.5 pays the other', () => {
	const g = withPayout('match_end');
	assert.equal(g.support.runnable, true, JSON.stringify(g.support.missing));
	const sides = g.sides.of;
	// seats of side 0 and side 1
	const a = [0, 1, 2, 3].filter((q) => sides[q] === sides[0]);
	const b = [0, 1, 2, 3].filter((q) => sides[q] !== sides[0]);
	// one deal is 91 points: three deals 46 : 45, the last one 46.5 : 44.5 - in all 184.5 : 179.5 (twelfths per seat)
	const deal = (ta, tb) => ({ [a[0]]: ta[0] * 12, [a[1]]: ta[1] * 12, [b[0]]: tb[0] * 12, [b[1]]: tb[1] * 12 });
	const m = matchAt(g, [deal([23, 23], [22.5, 22.5]), deal([23, 23], [22.5, 22.5]), deal([23, 23], [22.5, 22.5]), deal([23.25, 23.25], [22.25, 22.25])]);
	assert.equal(Object.values(m.standing().totals).reduce((x, y) => x + y, 0), 364 * 12);
	const st = m.standing();
	assert.deepEqual(st.winners.slice().sort(), a.slice().sort());
	assert.equal(a.reduce((x, q) => x + st.totals[q], 0), 184.5 * 12);
	assert.deepEqual(st.payments.map((x) => x.amount), [1, 1], 'pair_split: one stake from each seat of the losing pair');
	assert.deepEqual(new Set(st.payments.map((x) => x.from)), new Set(b));
	assert.deepEqual(new Set(st.payments.map((x) => x.to)), new Set(a));
	assert.equal(st.ledger[a[0]] + st.ledger[a[1]], 2);
	// the view carries the same list
	assert.deepEqual(m.view(0).match.payments, st.payments);
});

test('payout match_end: level over the four deals - nobody pays; mid-match - an empty list', () => {
	const g = withPayout('match_end');
	const sides = g.sides.of;
	const deal = (x, y) => Object.fromEntries([0, 1, 2, 3].map((q) => [q, sides[q] === sides[0] ? x : y]));
	const level = matchAt(g, [deal(12 * 45, 12 * 45), deal(12 * 45, 12 * 45), deal(12 * 45, 12 * 45), deal(12 * 45, 12 * 45)]);
	const st = level.standing();
	assert.deepEqual(st.winners, []);
	assert.deepEqual(st.payments, []);
	const mid = newMatch(g, { seed: 'mid', firstDealer: 0 });
	assert.deepEqual(mid.standing().payments, []);
	assert.deepEqual(mid.view(0).match.payments, []);
});

test('payout match_end: the hands pay no stake themselves; per_hand (the default) leaves the views as they were', () => {
	const g = withPayout('match_end');
	const m = newMatch(g, { seed: 'nopay', firstDealer: 0 });
	const rng = makeRng('nopay');
	playOut(m.hand, rng);
	assert.deepEqual(m.hand.result().payments, [], 'a hand of a match_end game pays nothing');
	const per = part(() => {});
	const m2 = newMatch(per, { seed: 'nopay', firstDealer: 0 });
	assert.ok(!('payments' in m2.view(0).match), 'no payments field for a file that pays per hand');
	assert.ok(!('payments' in m2.standing()));
	const explicit = part((f) => { f.match.payout = { value: 'per_hand', source: '[S] test' }; });
	assert.equal(explicit.support.runnable, true);
	playOut(newMatch(explicit, { seed: 'nopay', firstDealer: 0 }).hand, makeRng('nopay'));
});

test('payout match_end: pace is the only way out of a level match; objects carry their own mode and amount', () => {
	const g = part((f) => { f.match.payout = { value: { at: 'match_end', mode: 'losers_pay_winner', amount: 3 }, source: '[S] test' }; });
	assert.equal(g.support.runnable, true, JSON.stringify(g.support.missing));
	const sides = g.sides.of;
	const deal = (x, y) => Object.fromEntries([0, 1, 2, 3].map((q) => [q, sides[q] === sides[0] ? x : y]));
	const st = matchAt(g, [deal(12 * 50, 12 * 41), deal(12 * 50, 12 * 41), deal(12 * 50, 12 * 41), deal(12 * 50, 12 * 41)]).standing();
	assert.equal(st.payments.length, 4, 'both losers pay both winners');
	assert.ok(st.payments.every((x) => x.amount === 3));
	const bad = part((f) => { f.match.payout = { value: { at: 'match_end', mode: 'nonsense' }, source: '[S] test' }; });
	assert.equal(bad.support.runnable, false);
	const ledger = loadPatched('baronetti', 2, (f) => { f.match.payout = { value: 'match_end', source: '[S] test' }; });
	assert.equal(ledger.support.runnable, false, 'a ledger match has no end payout');
});

test('payout match_end: Venticinque for three - the lowest total pays the winner one stake', () => {
	const g = loadPatched('venticinque_3', 3, (f) => { f.match.payout = { value: { at: 'match_end', mode: 'loser_pays_winner', amount: { stake: 'simple' } }, source: '[S] test' }; });
	assert.equal(g.support.runnable, true, JSON.stringify(g.support.missing));
	// totals: each seat's points less 26 per round, over three rounds (76 more than 78 gives +; twelfths)
	const h = (a, b, c) => ({ 0: 12 * a, 1: 12 * b, 2: 12 * c });
	const st = matchAt(g, [h(30, 25, 20), h(30, 25, 20), h(30, 25, 20)]).standing();
	assert.deepEqual(st.winners, [0]);
	assert.deepEqual(pairs(st), ['2>0:1']);
	const none = matchAt(g, [h(24, 28, 24), h(24, 28, 24), h(24, 28, 24)]).standing();
	assert.deepEqual(none.winners, [1]);
	assert.deepEqual(pairs(none), ['0>1:1', '2>1:1'].sort(), 'equal lowest totals both pay (as at the hand)');
	const neg = matchAt(g, [h(24, 26, 24), h(24, 26, 24), h(24, 26, 24)]).standing();
	assert.deepEqual(neg.winners, []);
	assert.deepEqual(neg.payments, []);
});

// ---- Y3: round toward_zero ----
import { stepsOf } from '../../core/modules/settle.js';

test('round toward_zero: whole steps from the line, on both sides', () => {
	const P = { of: 'declarer_side', from: 45, every: 5, unit: 1, round: 'toward_zero', direction: 'both' };
	const at = (pts) => stepsOf(Math.round(pts * 12), P);
	assert.equal(at(45), 0);
	assert.equal(at(48), 0);
	assert.equal(at(49.5), 0);
	assert.equal(at(50), 1);
	assert.equal(at(54.5), 1);
	assert.equal(at(55), 2);
	assert.equal(at(43), 0);
	assert.equal(at(40.5), 0);
	assert.equal(at(40), -1);
	assert.equal(at(35), -2);
	assert.ok(Object.is(at(43), 0), 'no negative zero');
	assert.equal(at(47.5), 0);
	assert.equal(at(42.5), 0);
});

test('round toward_zero is a value of per_points', () => {
	assert.equal(settle.supports.amount({ per_points: { of: 'declarer_side', from: 45, every: 5, unit: 1, round: 'toward_zero' } }, { rules: {}, phases: [{ module: 'bidding' }] }), true);
});

// ---- The random opponent of the bot lab makes no false «fuora» ----
import { playHand as labHand } from '../../tools/botlab/play.mjs';
import { loadGame, newHand } from '../../core/index.js';
import { chooseAction as randomAction } from '../../bots/random.js';
import { getFile } from './helpers.js';

test('bot lab: the random robot claims fuora only when it is out; the plain random robot would claim falsely', () => {
	for (const id of ['sedici_2', 'trentuno']) {
		let lab = 0, plain = 0;
		const game = loadGame(id, getFile, { seats: 2 });
		for (let h = 0; h < 30; h++) {
			const r = labHand({ id, seats: 2, seed: 'y7', h, a: 'random', b: 'random' });
			assert.equal(r.error, undefined);
			lab += r.falseClaims;
			const hand = newHand(game, { seed: 'y7plain:' + h, dealer: h % 2 });
			const rng = makeRng('y7plain:' + h);
			while (!hand.isOver()) {
				const seat = hand.toAct()[0];
				assert.ok(hand.apply(seat, randomAction(hand.legal(seat), rng)).ok);
			}
			plain += hand.s.m.fuora.claims.filter((c) => !c.valid).length;
		}
		assert.equal(lab, 0, id + ': no false claim in the lab');
		assert.ok(plain > 0, id + ': the plain random robot does claim falsely (the noise the lab removes)');
	}
});

// ---- the game files of revision 10 carry the end-of-match payment ----
test('revision 10 files: four deals (Partita for four), the sum of four deals (Consiglio) and Venticinque for three pay at the end of the match', () => {
	const val = (g) => g.rules.match.payout && g.rules.match.payout.value;
	assert.equal(val(loadPatched('partita_4', 4, () => {}, { variant: 'four_deals' })), 'match_end');
	assert.equal(val(loadPatched('consiglio', 4, () => {}, { variant: 'sum_of_four_deals' })), 'match_end');
	assert.deepEqual(val(loadPatched('venticinque_3', 3, () => {})), { at: 'match_end', mode: 'loser_pays_winner', amount: { stake: 'simple' } });
	for (const g of [loadPatched('partita_4', 4, () => {}), loadPatched('consiglio', 4, () => {})]) assert.equal(val(g), undefined, 'the base games pay by the deal');
	// and the match really pays one stake at the end, none by the deal
	const g = loadPatched('venticinque_3', 3, () => {});
	const h = (a, b, c) => ({ 0: 12 * a, 1: 12 * b, 2: 12 * c });
	const st = matchAt(g, [h(30, 25, 20), h(30, 25, 20), h(30, 25, 20)]).standing();
	assert.deepEqual(pairs(st), ['2>0:1']);
});
