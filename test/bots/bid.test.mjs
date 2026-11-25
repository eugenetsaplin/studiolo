// The bid by sampling (bots/bid.js): worlds at a bid, view only, a strong hand bids and a weak one passes, the margin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction, parseLevel } from '../../bots/index.js';
import { isBidView } from '../../bots/bid.js';
import { ALL } from '../../core/cards.js';
import { game, level } from './lib.mjs';

const AUCTIONS = [['permesso_3', 3], ['permesso_4', 4], ['permesso_5', 5], ['permesso_6', 6], ['permesso_7', 7], ['chiamare_il_re', 4]];
const small = { ...level('normal'), worlds: 12, budget_plays: 6000 };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// the bid views met while random actions are played (the first bids, and bids over a standing bid)
function bidViews(g, seed, max) {
	const out = [];
	for (let d = 0; out.length < max && d < 200; d++) {
		const h = newHand(g, { seed: `${seed}${d}`, dealer: d % g.seats });
		const rng = makeRng(`${seed}r${d}`);
		while (!h.isOver() && h.cur.module !== 'tricks' && out.length < max) {
			const q = h.toAct()[0];
			const v = h.view(q);
			if (isBidView(v)) out.push({ h: h.clone(), q, v });
			const legal = h.legal(q);
			const pass = legal.find((a) => a.type === 'pass');
			h.apply(q, pass && rng.next() < 0.6 ? pass : legal[rng.int(legal.length)]);
		}
	}
	return out;
}

for (const [id, n] of AUCTIONS) {
	const g = game(id, n);
	test(`${id}:${n} a bid is judged on sampled worlds (every one of 12 bid views builds worlds), the answer is legal`, () => {
		const views = bidViews(g, 'B', 12);
		assert.ok(views.length >= 8, 'too few bid views: ' + views.length);
		for (const { v } of views) {
			const r = chooseAction({ game: g, view: v, level: small, seed: 'b' });
			assert.ok(v.legal.some((a) => same(a, r.action)), 'not legal');
			if (r.stats.candidates === 1) { assert.equal(r.action.type, 'pass'); continue; } // nothing higher than the standing bid
			assert.ok(r.stats.worlds >= 6, `only ${r.stats.worlds} worlds`);
			assert.ok(r.eval.some((e) => e.action.type === 'pass'), 'the pass was not measured');
		}
	});

	test(`${id}:${n} view only at a bid: swapped hidden hands give the same answer`, () => {
		let swapped = 0;
		for (const { h, q } of bidViews(g, 'S', 10)) {
			const others = [...Array(n).keys()].filter((x) => x !== q);
			for (const x of others) for (const y of others) {
				if (x >= y || h.s.hands[x].length !== h.s.hands[y].length || h.s.discard[x].length !== h.s.discard[y].length) continue;
				const h2 = h.clone();
				[h2.s.hands[x], h2.s.hands[y]] = [h2.s.hands[y], h2.s.hands[x]];
				[h2.s.discard[x], h2.s.discard[y]] = [h2.s.discard[y], h2.s.discard[x]];
				const v1 = h.view(q);
				const v2 = h2.view(q);
				if (!same(v1, v2)) continue;
				assert.deepEqual(chooseAction({ game: g, view: v1, level: small, seed: 's' }), chooseAction({ game: g, view: v2, level: small, seed: 's' }));
				swapped++;
				break;
			}
		}
		// at three seats only the dealer's bid has two others alike (the dealer's discard is hidden)
		assert.ok(swapped >= (n === 3 ? 1 : 3), 'too few hidden swaps: ' + swapped);
	});
}

// A deal of Permesso for three where seat 1 (first to speak) holds `mine`; the rest is shuffled to the others.
function dealWith(mine, seed) {
	const g = game('permesso_3', 3);
	const rng = makeRng(seed);
	const rest = ALL.filter((c) => !mine.includes(c));
	for (let i = rest.length - 1; i > 0; i--) { const j = rng.int(i + 1); [rest[i], rest[j]] = [rest[j], rest[i]]; }
	const hands = { 0: rest.slice(0, 28), 1: mine, 2: rest.slice(28, 53) };
	const h = newHand(g, { seed, dealer: 0, preset: { hands, rest: [] } });
	while (!h.isOver() && !isBidView(h.view(h.toAct()[0]))) {
		const q = h.toAct()[0];
		h.apply(q, chooseAction({ game: g, view: h.view(q), level: small, seed: 'x' }).action);
	}
	return { g, h };
}

const STRONG = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14', 'T13', 'T12', 'T11', 'T0', 'T1', 'swords:K', 'batons:K', 'cups:K', 'coins:K', 'swords:Q', 'cups:Q', 'coins:Q', 'batons:Q', 'swords:N', 'cups:N', 'batons:N', 'coins:N'];
const WEAK = ['T2', 'T3', 'swords:1', 'swords:2', 'swords:3', 'swords:4', 'swords:5', 'swords:6', 'swords:7', 'batons:1', 'batons:2', 'batons:3', 'batons:4', 'batons:5', 'batons:6', 'cups:1', 'cups:2', 'cups:3', 'cups:4', 'cups:5', 'coins:1', 'coins:2', 'coins:3', 'coins:4', 'coins:5'];

test('a hand full of high trumps and honours bids, a hand of low cards passes', () => {
	for (const [cards, bids] of [[STRONG, true], [WEAK, false]]) {
		assert.equal(cards.length, 25);
		const { g, h } = dealWith(cards, 'deal' + bids);
		const q = h.toAct()[0];
		assert.equal(q, 1);
		const r = chooseAction({ game: g, view: h.view(q), level: { ...level('normal'), worlds: 40 }, seed: 'k' });
		assert.equal(r.action.type !== 'pass', bids, JSON.stringify(r.eval));
	}
});

test('bid_margin: optional, checked, and a margin nobody can beat makes the bot pass', () => {
	const base = JSON.parse(JSON.stringify(level('normal')));
	assert.equal(parseLevel(base).bid_margin, undefined);
	assert.equal(parseLevel({ ...base, bid_margin: 3 }).bid_margin, 3);
	assert.throws(() => parseLevel({ ...base, bid_margin: -1 }), /bid_margin/);
	assert.throws(() => parseLevel({ ...base, bid_margin: 'x' }), /bid_margin/);
	const { g, h } = dealWith(STRONG, 'dealtrue');
	const q = h.toAct()[0];
	const r = chooseAction({ game: g, view: h.view(q), level: { ...level('normal'), worlds: 40, bid_margin: 1000 }, seed: 'k' });
	assert.equal(r.action.type, 'pass');
});
