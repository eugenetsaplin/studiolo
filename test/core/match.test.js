// The match kinds, the dealer rotation, the payments of the hands, the random robot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, makeRng, replayHand } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { load, loadPatched, playRandom, CASES } from './helpers.js';

function finishHand(m, rng) {
	const h = m.hand;
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		const a = chooseAction(h.legal(seat), rng);
		assert.ok(h.apply(seat, a).ok);
	}
}

function playMatch(m, rng, cap = 100) {
	const dealers = [];
	for (let i = 0; i < cap; i++) {
		dealers.push(m.hand.s.dealer);
		finishHand(m, rng);
		if (m.isOver()) break;
		m.next();
	}
	return dealers;
}

test('fixed_hands with a card-points tiebreak: four hands, the dealer alternates', () => {
	const game = load('venticinque', 2);
	for (let k = 0; k < 20; k++) {
		const m = newMatch(game, { seed: 'm' + k, firstDealer: k % 2 });
		assert.throws(() => m.next(), /not over/);
		const rng = makeRng('mr' + k);
		const dealers = playMatch(m, rng);
		assert.equal(dealers.length, 4);
		assert.deepEqual(dealers, [k % 2, 1 - (k % 2), k % 2, 1 - (k % 2)]);
		assert.ok(m.isOver());
		const st = m.standing();
		assert.equal(st.kind, 'fixed_hands');
		assert.equal(st.hands.length, 4);
		assert.equal(st.gamePoints[0] + st.gamePoints[1], 4 - st.hands.filter((r) => r.outcome === 'tie').length);
		assert.ok(Array.isArray(st.winners));
		if (st.gamePoints[0] !== st.gamePoints[1]) assert.deepEqual(st.winners, [st.gamePoints[0] > st.gamePoints[1] ? 0 : 1]);
		else if (st.totals[0] !== st.totals[1]) assert.deepEqual(st.winners, [st.totals[0] > st.totals[1] ? 0 : 1], 'the card points decide');
		else assert.deepEqual(st.winners, []);
		assert.throws(() => m.next(), /over/);
	}
});

test('the hand seed is the match seed, a colon and the hand index; the first dealer is drawn from the seed', () => {
	const game = load('venticinque', 2);
	const m = newMatch(game, { seed: 'abc', firstDealer: 1 });
	assert.equal(m.hand.s.seed, 'abc:0');
	assert.equal(m.hand.s.dealer, 1);
	finishHand(m, makeRng('x'));
	m.next();
	assert.equal(m.hand.s.seed, 'abc:1');
	assert.equal(m.hand.s.dealer, 0);
	const a = newMatch(game, { seed: 'zzz' });
	const b = newMatch(game, { seed: 'zzz' });
	assert.equal(a.hand.s.dealer, b.hand.s.dealer);
	const dealers = new Set();
	for (let i = 0; i < 40; i++) dealers.add(newMatch(load('partita_4', 4), { seed: 'd' + i }).hand.s.dealer);
	assert.equal(dealers.size, 4, 'every seat can be drawn');
	// a match's hand can be replayed from its seed and log alone
	const h = m.hand;
	finishHand(m, makeRng('y'));
	assert.equal(replayHand(game, { seed: 'abc:1', dealer: 0, carry: { match: { kind: 'fixed_hands', handIndex: 1 } } }, h.log).checksum(), h.checksum());
});

test('single_hand ends with the hand', () => {
	const game = loadPatched('venticinque', 2, (f) => { delete f.match; });
	const m = newMatch(game, { seed: 's', firstDealer: 0 });
	assert.equal(m.isOver(), false);
	finishHand(m, makeRng('s'));
	assert.equal(m.isOver(), true);
	const st = m.standing();
	assert.equal(st.kind, 'single_hand');
	assert.deepEqual(st.winners, m.hand.result().winners);
});

test('race: to the target in game points; a tied hand is dealt again by the same dealer', () => {
	const game = loadPatched('venticinque', 2, (f) => { f.match.hands.value = 0; f.match.target.value = 2; });
	const m = newMatch(game, { seed: 'race', firstDealer: 0 });
	const rng = makeRng('race');
	let n = 0;
	for (; n < 50; n++) {
		finishHand(m, rng);
		if (m.isOver()) break;
		m.next();
	}
	const st = m.standing();
	assert.equal(st.kind, 'race');
	assert.ok(Math.max(st.gamePoints[0], st.gamePoints[1]) === 2);
	assert.equal(st.winners.length, 1);
	assert.equal(st.winners[0], st.gamePoints[0] === 2 ? 0 : 1);
	assert.ok(st.hands.length >= 2);
});

test('running_total: the points of three rounds, less the round target each; one stake from the lowest total at the end (revision 10)', () => {
	const game = load('venticinque_3', 3);
	const m = newMatch(game, { seed: 'rt', firstDealer: 0 });
	const rng = makeRng('rt');
	const dealers = playMatch(m, rng);
	assert.equal(dealers.length, 3);
	assert.deepEqual(dealers, [0, 1, 2], 'the dealer moves to the right');
	const st = m.standing();
	assert.equal(st.kind, 'running_total');
	for (let q = 0; q < 3; q++) {
		const sum = st.hands.reduce((a, r) => a + r.points[q], 0);
		assert.equal(st.totals[q], sum - 3 * 26 * 12);
	}
	const best = Math.max(...Object.values(st.totals));
	const worst = Math.min(...Object.values(st.totals));
	assert.deepEqual(st.winners, best > 0 ? [0, 1, 2].filter((q) => st.totals[q] === best) : []);
	// the hands pay nothing; at the end the lowest total pays each winner one stake (nobody when no total is above zero or all are level)
	for (const r of st.hands) assert.deepEqual(r.payments, []);
	const payers = best > 0 && worst < best ? [0, 1, 2].filter((q) => st.totals[q] === worst) : [];
	assert.deepEqual(st.payments.map((x) => x.from).sort(), payers.flatMap((p) => st.winners.map(() => p)).sort());
	assert.ok(st.payments.every((x) => x.amount === 1 && st.winners.includes(x.to) && st.totals[x.from] === worst));
	for (let q = 0; q < 3; q++) assert.equal(st.ledger[q], st.payments.reduce((a, x) => a + (x.to === q ? x.amount : 0) - (x.from === q ? x.amount : 0), 0));
	assert.ok(m.view(0).match.standing.kind === 'running_total');
});

test('ledger without dealer_rounds: the stakes add up hand after hand and the match is never over by itself', () => {
	const game = loadPatched('partita_3', 3, (f) => { delete f.match.dealer_rounds; }, { seats: 3, options: { stake: 2 } });
	const m = newMatch(game, { seed: 'lg', firstDealer: 2 });
	const rng = makeRng('lg');
	const dealers = [];
	for (let i = 0; i < 12; i++) { dealers.push(m.hand.s.dealer); finishHand(m, rng); assert.equal(m.isOver(), false); m.next(); }
	assert.deepEqual(dealers.slice(0, 4), [2, 0, 1, 2]);
	finishHand(m, rng);
	const st = m.standing();
	assert.equal(st.winners, null);
	assert.equal(Object.values(st.ledger).reduce((a, b) => a + b, 0), 0, 'what is paid is received');
	assert.ok(Object.values(st.ledger).some((x) => x !== 0));
	assert.ok(Object.values(st.ledger).every((x) => x % 2 === 0), 'the stake is 2');
});

// the five stake games end after dealer_rounds x seats deals; every player deals once in a round
const LEDGER_ENDS = [['partita_3', 3, 3], ['partita_4', 4, 4], ['consiglio', 4, 4], ['dottore', 5, 5], ['meno', 2, 2], ['meno', 3, 3], ['meno', 4, 4], ['meno', 5, 5], ['meno', 6, 6], ['meno', 7, 7]];
for (const [id, n, hands] of LEDGER_ENDS) {
	test(`ledger with dealer_rounds: ${id} for ${n} ends after ${hands} deals, the dealer passes around, the greatest balance wins`, () => {
		const game = load(id, n);
		assert.equal(game.cfg.match.kind, 'ledger');
		assert.equal(game.cfg.match.dealer_rounds, 1);
		for (let k = 0; k < 6; k++) {
			const m = newMatch(game, { seed: `le-${id}-${n}-${k}`, firstDealer: k % n });
			const rng = makeRng(`ler-${id}-${n}-${k}`);
			const dealers = playMatch(m, rng, 40);
			assert.equal(dealers.length, hands);
			assert.deepEqual([...dealers].sort(), Array.from({ length: n }, (_, q) => q), 'every player deals once');
			assert.ok(m.isOver());
			const st = m.standing();
			assert.equal(st.hands.length, hands);
			assert.equal(Object.values(st.ledger).reduce((a, b) => a + b, 0), 0);
			const sides = game.sides;
			const seats = Array.from({ length: n }, (_, q) => q);
			const sum = (id2) => seats.filter((q) => sides.of[q] === id2).reduce((a, q) => a + st.ledger[q], 0);
			const ids = [...new Set(seats.map((q) => sides.of[q]))];
			const best = Math.max(...ids.map(sum));
			const top = ids.filter((i) => sum(i) === best);
			assert.deepEqual(st.winners, top.length === 1 ? seats.filter((q) => sides.of[q] === top[0]) : []);
			assert.throws(() => m.next(), /over/);
		}
	});
}

test('ledger with dealer_rounds: two rounds make twice as many deals; a draw when the greatest balances are equal', () => {
	const g2 = loadPatched('partita_3', 3, (f) => { f.match.dealer_rounds.value = 2; }, { seats: 3 });
	const m = newMatch(g2, { seed: 'two', firstDealer: 0 });
	assert.equal(playMatch(m, makeRng('two'), 40).length, 6);
	let draws = 0, wins = 0;
	for (let k = 0; k < 400 && !(draws >= 3 && wins >= 3); k++) {
		const mm = newMatch(load('meno', 2), { seed: 'dr' + k, firstDealer: k % 2 });
		playMatch(mm, makeRng('drr' + k), 10);
		const st = mm.standing();
		if (st.ledger[0] === st.ledger[1]) { draws++; assert.deepEqual(st.winners, []); }
		else { wins++; assert.deepEqual(st.winners, [st.ledger[0] > st.ledger[1] ? 0 : 1]); }
	}
	assert.ok(draws >= 1, 'a draw was met: ' + draws);
	assert.ok(wins >= 1);
});

test('the variants four_deals and sum_of_four_deals inherit dealer_rounds and still play as fixed_hands', () => {
	for (const [id, v] of [['partita_4', 'four_deals'], ['consiglio', 'sum_of_four_deals']]) {
		const g = load(id, 4, { variant: v });
		assert.equal(g.support.runnable, true, id);
		assert.equal(g.cfg.match.kind, 'fixed_hands');
		const m = newMatch(g, { seed: 'v' + id, firstDealer: 0 });
		assert.equal(playMatch(m, makeRng('v' + id), 40).length, 4);
		assert.ok(Array.isArray(m.standing().winners));
	}
});

test('the dealer rotation: left, alternate, loser_deals (the alts), previous_last_taker leads', () => {
	// a match past its end: the rotation is what is tested, so the leaf that ends the match is taken out
	const left = newMatch(loadPatched('partita_3', 3, (f) => { delete f.match.dealer_rounds; }, { alts: ['seats.dealer_rotation'] }), { seed: 'l', firstDealer: 0 });
	const rng = makeRng('rot');
	const d = playMatch(left, rng, 4);
	assert.deepEqual(d, [0, 2, 1, 0]);
	const ld = load('venticinque', 2, { alts: ['seats.dealer_rotation'] });
	for (let k = 0; k < 10; k++) {
		const m = newMatch(ld, { seed: 'ld' + k, firstDealer: 0 });
		finishHand(m, rng);
		const r = m.hand.result();
		const worst = r.worst.length ? r.worst[0] : 1;
		m.next();
		assert.equal(m.hand.s.dealer, worst, 'the loser deals');
	}
	const game = loadPatched('venticinque_3', 3, (f) => { f.hand.phases.find((p) => p.id === 'tricks').settings.first_leader.value = 'previous_last_taker'; });
	const m = newMatch(game, { seed: 'plt', firstDealer: 0 });
	finishHand(m, rng);
	const taker = m.hand.s.tricks.at(-1).winner;
	m.next();
	while (m.hand.s.phase === 'a_monte') m.hand.apply(m.hand.toAct()[0], { type: 'a_monte_pass' });
	while (m.hand.s.phase === 'discard') { const a = m.hand.legal(m.hand.toAct()[0])[0]; m.hand.apply(m.hand.toAct()[0], a); }
	assert.deepEqual(m.hand.toAct(), [taker], 'who took the last trick leads the next hand');
});

test('payments: each loser pays the winner the stake; pair_split pairs one winner with one opponent; a tie pays nothing; Meno: the one with the most points pays each winner', () => {
	const p3 = load('partita_3', 3, { options: { stake: 5 } });
	let wins = 0;
	for (let i = 0; i < 200; i++) {
		const r = playRandom(p3, 'pay' + i, i % 3, null).result();
		if (r.outcome === 'win') {
			wins++;
			assert.equal(r.payments.length, 2);
			assert.ok(r.payments.every((p) => p.to === r.winners[0] && p.from !== p.to && p.amount === 5));
		} else assert.deepEqual(r.payments, []);
	}
	assert.ok(wins > 150);
	const p4 = load('partita_4', 4);
	for (let i = 0; i < 100; i++) {
		const r = playRandom(p4, 'pair' + i, i % 4, null).result();
		if (r.outcome !== 'win') { assert.deepEqual(r.payments, []); continue; }
		assert.equal(r.payments.length, 2);
		assert.deepEqual(r.payments.map((p) => p.to).sort(), r.winners);
		assert.equal(new Set(r.payments.map((p) => p.from)).size, 2);
		for (const p of r.payments) assert.ok(!r.winners.includes(p.from));
		assert.equal(r.gamePoints[0], 0, 'game_points none: the hand settles in stakes only');
		assert.equal(r.points[0], r.points[2], 'partners count in one heap');
		assert.equal(r.sidePoints[0], r.points[0]);
	}
	const ml = load('meno', 4);
	for (let i = 0; i < 50; i++) {
		const r = playRandom(ml, 'me' + i, 0, null).result();
		if (r.outcome === 'win') {
			const min = Math.min(...Object.values(r.points));
			assert.equal(r.points[r.winners[0]], min, 'fewest points wins');
			// revision 10: the players level on the fewest points all win; the one with the most points pays each of them one stake
			const max = Math.max(...Object.values(r.points));
			assert.deepEqual(r.winners, Object.keys(r.points).map(Number).filter((q) => r.points[q] === min));
			const payers = Object.keys(r.points).map(Number).filter((q) => r.points[q] === max);
			assert.deepEqual(r.payments.map((x) => `${x.from}>${x.to}`).sort(), payers.flatMap((p) => r.winners.map((w) => `${p}>${w}`)).sort());
			assert.equal(r.payments.length, payers.length * r.winners.length);
		}
	}
});

test('a tie: equal points give no winner and no game point', () => {
	// a patched file whose result is a threshold nobody reaches: the outcome is none, not a tie, and nobody wins
	const g = loadPatched('venticinque', 2, (f) => { const r = f.hand.phases.find((p) => p.id === 'result').settings; r.winner.value = 'threshold'; r.target = { value: 200, source: '[S] t' }; });
	const r = playRandom(g, 'th', 0, null).result();
	assert.equal(r.outcome, 'none');
	assert.deepEqual(r.winners, []);
	assert.equal(Object.values(r.gamePoints).reduce((a, b) => a + b, 0), 0);
	// the dry hand: one_or_two_dry
	const dry = loadPatched('venticinque', 2, (f) => { const r2 = f.hand.phases.find((p) => p.id === 'result').settings; r2.game_points.value = 'one_or_two_dry'; r2.shut_num.value = 100; r2.shut_den.value = 1; });
	const d = playRandom(dry, 'dry', 0, null).result();
	assert.equal(Math.max(...Object.values(d.gamePoints)), 2);
});

test('the random robot: uniform over the actions, the a_monte proposal with probability 0.05', () => {
	const rng = makeRng('bot');
	const acts = [{ type: 'play', card: 'T1' }, { type: 'play', card: 'T2' }, { type: 'play', card: 'T3' }];
	const seen = { T1: 0, T2: 0, T3: 0 };
	for (let i = 0; i < 6000; i++) seen[chooseAction(acts, rng).card]++;
	for (const k of Object.keys(seen)) assert.ok(seen[k] > 1800 && seen[k] < 2200, k + ' ' + seen[k]);
	const offer = [{ type: 'a_monte_propose' }, { type: 'a_monte_pass' }];
	let propose = 0;
	for (let i = 0; i < 20000; i++) if (chooseAction(offer, rng).type === 'a_monte_propose') propose++;
	assert.ok(propose > 800 && propose < 1200, 'about 5%: ' + propose);
	assert.equal(chooseAction([{ type: 'a_monte_propose' }], rng).type, 'a_monte_propose');
	assert.equal(chooseAction([], rng), null);
	void CASES;
});
