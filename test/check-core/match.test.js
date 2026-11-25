// Independent check of the core: the match kinds of the six files, the dealer rotation, the hand seeds, the standing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, newHand, makeRng } from '../../core/index.js';
import { load, loadWith, playOut } from './lib.mjs';

const pick = (hh, seat, legal, rng) => (legal[0].type === 'a_monte_propose' ? legal[1] : legal[rng.int(legal.length)]);

function runMatch(game, seed, firstDealer, maxHands = 12) {
	const m = newMatch(game, { seed, firstDealer });
	const dealers = [];
	const seeds = [];
	for (let k = 0; k < maxHands; k++) {
		dealers.push(m.hand.s.dealer);
		seeds.push(m.hand.s.seed);
		playOut(m.hand, { seed: seed + k, pick });
		if (m.isOver()) break;
		m.next();
	}
	return { m, dealers, seeds };
}

test('venticinque and morto: four hands, the deal alternates, seeds seed:0..3, the most game points win, ties go to card points', () => {
	for (const id of ['venticinque', 'morto']) {
		const g = load(id, 2);
		let tieBroken = 0;
		for (let i = 0; i < 40; i++) {
			const { m, dealers, seeds } = runMatch(g, `mt-${id}-${i}`, i % 2);
			assert.ok(m.isOver());
			assert.deepEqual(dealers, [0, 1, 2, 3].map((k) => (i % 2 + k) % 2));
			assert.deepEqual(seeds, [0, 1, 2, 3].map((k) => `mt-${id}-${i}:${k}`));
			const st = m.standing();
			assert.equal(st.kind, 'fixed_hands');
			assert.equal(st.hands.length, 4);
			const gp = [0, 1].map((q) => st.hands.reduce((a, r) => a + (r.winners.includes(q) ? 1 : 0), 0));
			assert.deepEqual([st.gamePoints[0], st.gamePoints[1]], gp);
			const cp = [0, 1].map((q) => st.hands.reduce((a, r) => a + r.points[q], 0));
			let want;
			if (gp[0] !== gp[1]) want = [gp[0] > gp[1] ? 0 : 1];
			else { tieBroken++; want = cp[0] === cp[1] ? [] : [cp[0] > cp[1] ? 0 : 1]; }
			assert.deepEqual(st.winners, want, `${id} match ${i}`);
			assert.throws(() => m.next());
		}
		assert.ok(tieBroken > 0, 'no 2:2 match was seen');
	}
});

test('the match refuses next() before the hand is over; the winners are null until the end', () => {
	const m = newMatch(load('venticinque', 2), { seed: 'early', firstDealer: 0 });
	assert.throws(() => m.next());
	assert.equal(m.standing().winners, null);
});

test('the first dealer without firstDealer comes from the seed (and is reproducible)', () => {
	const g = load('partita_4', 4);
	const seen = new Set();
	for (let i = 0; i < 40; i++) {
		const a = newMatch(g, { seed: 'fd' + i });
		const b = newMatch(g, { seed: 'fd' + i });
		assert.equal(a.hand.s.dealer, b.hand.s.dealer);
		assert.equal(a.hand.s.dealer, makeRng('fd' + i + ':dealer').int(4));
		seen.add(a.hand.s.dealer);
	}
	assert.equal(seen.size, 4);
});

test('venticinque_3: running total over three hands, points less 26 per hand, the highest positive total wins; at the end the lowest total pays each winner one stake', () => {
	const g = load('venticinque_3', 3);
	for (let i = 0; i < 30; i++) {
		const { m, dealers } = runMatch(g, 'rt' + i, 1);
		assert.deepEqual(dealers, [1, 2, 0], 'the deal passes to the right (+1)');
		const st = m.standing();
		assert.equal(st.kind, 'running_total');
		assert.equal(st.hands.length, 3);
		const tot = [0, 1, 2].map((q) => st.hands.reduce((a, r) => a + r.points[q] - 312, 0));
		assert.deepEqual([0, 1, 2].map((q) => st.totals[q]), tot);
		const best = Math.max(...tot);
		assert.deepEqual(st.winners, best > 0 ? [0, 1, 2].filter((q) => tot[q] === best) : []);
		// revision 10: the hands pay nothing; once, at the end, the lowest total pays the winner one stake (nobody when no total is above zero or all are level)
		const low = Math.min(...tot);
		const payers = best > 0 && low < best ? [0, 1, 2].filter((q) => tot[q] === low) : [];
		const want = new Map();
		for (const f of payers) for (const w of st.winners) { want.set(f, (want.get(f) || 0) - 1); want.set(w, (want.get(w) || 0) + 1); }
		for (const r of st.hands) assert.deepEqual(r.payments, [], 'a hand pays nothing');
		for (const q of [0, 1, 2]) assert.equal(st.ledger[q], want.get(q) || 0, 'one stake at the end of the match');
	}
});

test('ledger (partita_3, partita_4, meno): ends after one round of dealers; the ledger is the sum of the payments; the deal passes right', () => {
	for (const [id, n] of [['partita_3', 3], ['partita_4', 4], ['meno', 7]]) {
		const g = load(id, n);
		const { m, dealers } = runMatch(g, 'lg' + id, 0, n + 2);
		assert.equal(m.isOver(), true);
		assert.deepEqual(dealers, Array.from({ length: n }, (_, k) => k % n));
		const st = m.standing();
		const led = Array.from({ length: n }, () => 0);
		for (const r of st.hands) for (const p of r.payments) { led[p.from] -= p.amount; led[p.to] += p.amount; }
		assert.deepEqual(Array.from({ length: n }, (_, q) => st.ledger[q]), led);
		assert.equal(led.reduce((a, b) => a + b, 0), 0);
		assert.ok(Array.isArray(st.winners));
	}
});

test('dealer_rotation alt: venticinque with loser_deals gives the next deal to the loser', () => {
	const g = load('venticinque', 2, { alts: ['seats.dealer_rotation'] });
	for (let i = 0; i < 20; i++) {
		const m = newMatch(g, { seed: 'ld' + i, firstDealer: 0 });
		playOut(m.hand, { seed: 'ld' + i, pick });
		const r = m.hand.result();
		m.next();
		const loser = r.winners.length ? 1 - r.winners[0] : null;
		assert.equal(m.hand.s.dealer, loser === null ? 1 : loser);
	}
});

// BUG: a match of pairs can never be won: _winners() returns [] when two seats tie, and partners always tie
test('partita_4 variant four_deals: the side with more card points over four hands wins the match (both partners)', () => {
	const g = load('partita_4', 4, { variant: 'four_deals' });
	let won = 0;
	for (let i = 0; i < 20; i++) {
		const { m } = runMatch(g, 'fd4-' + i, 0);
		assert.ok(m.isOver());
		const st = m.standing();
		const side = [0, 1].map((s) => st.hands.reduce((a, r) => a + r.sidePoints[s], 0));
		if (side[0] !== side[1]) {
			const w = side[0] > side[1] ? [0, 2] : [1, 3];
			assert.deepEqual(st.winners, w, `match ${i}: totals ${side}`);
			won++;
		}
	}
	assert.ok(won > 0);
});

test('consiglio variant sum_of_four_deals: the same, partners side by side (0 with 1)', () => {
	const g = load('consiglio', 4, { variant: 'sum_of_four_deals' });
	const { m } = runMatch(g, 'cons', 0);
	const st = m.standing();
	const side = [0, 1].map((s) => st.hands.reduce((a, r) => a + r.sidePoints[s], 0));
	if (side[0] !== side[1]) assert.deepEqual(st.winners, side[0] > side[1] ? [0, 1] : [2, 3]);
});

test('a bare hand has match null; a match hand carries kind and handIndex', () => {
	const g = load('venticinque', 2);
	assert.equal(newHand(g, { seed: 'b', dealer: 0 }).view(0).match, null);
	const m = newMatch(g, { seed: 'b', firstDealer: 0 });
	const v = m.view(1);
	assert.equal(v.match.kind, 'fixed_hands');
	assert.equal(v.match.handIndex, 0);
	assert.ok(v.match.standing);
});

test('dealer_rotation alt left (partita_4): the deal passes to the left (-1)', () => {
	// past the end of the match (the leaf that ends it is taken out): only the rotation is tested
	const g = loadWith('partita_4', 4, (f) => { delete f.match.dealer_rounds; }, { alts: ['seats.dealer_rotation'] });
	const { dealers } = runMatch(g, 'left', 0, 6);
	assert.deepEqual(dealers, [0, 3, 2, 1, 0, 3]);
});
