// The bot for the ten contract games. View only, determinism, legal answers, the bid policy, worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { ctxOf, bidAction, layAction, callPartnerAction, declareAction, worthOf } from '../../bots/policy.js';
import { prepare, sampleWorld } from '../../bots/worlds.js';
import { game, level } from './lib.mjs';

export const PAIRS = [['sedici_3', 3], ['sedici_4', 4], ['trentuno', 3], ['trentuno', 4], ['mitigati_2', 2], ['bagattultimo', 3], ['chiamare_il_re', 4],
	['permesso_3', 3], ['permesso_4', 4], ['permesso_5', 5], ['permesso_6', 6], ['permesso_7', 7]];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tiny = { ...level('easy'), worlds: 2, budget_plays: 300, noise: 0 };

// a walk through random hands; visit(h, seat, view) before every `every`-th action
function walk(g, seed, max, visit, every = 1) {
	let seen = 0;
	for (let d = 0; seen < max && d < 600; d++) {
		const h = newHand(g, { seed: `${seed}${d}`, dealer: d % g.seats });
		const rng = makeRng(`${seed}r${d}`);
		let k = 0;
		while (!h.isOver() && seen < max) {
			const q = h.toAct()[0];
			const legal = h.legal(q);
			if (k++ % every === 0) { visit(h, q); seen++; }
			h.apply(q, legal[rng.int(legal.length)]);
		}
	}
	return seen;
}

for (const [id, n] of PAIRS) {
	const g = game(id, n);
	test(`${id}:${n} every answer is legal (2000 decisions)`, () => {
		const seen = walk(g, 'L', 2000, (h, q) => {
			const v = h.view(q);
			const r = chooseAction({ game: g, view: v, level: tiny, seed: 'a' + h.s.log.length });
			assert.ok(v.legal.some((a) => same(a, r.action)), 'not legal: ' + JSON.stringify(r.action));
		});
		assert.equal(seen, 2000);
	});

	test(`${id}:${n} determinism, and the same answer from a clone`, () => {
		walk(g, 'D', 40, (h, q) => {
			const v = h.view(q);
			const a = chooseAction({ game: g, view: v, level: tiny, seed: 'd' });
			const b = chooseAction({ game: g, view: h.clone().view(q), level: tiny, seed: 'd' });
			assert.deepEqual(a, b);
		}, 3);
	});

	test(`${id}:${n} view only: swapped hidden hands give the same answer`, () => {
		let swapped = 0;
		walk(g, 'V', 150, (h, q) => {
			if (h.cur.module !== 'tricks') return;
			const others = [...Array(n).keys()].filter((x) => x !== q && h.s.hands[x].length > 0);
			for (const x of others) for (const y of others) {
				if (x >= y || h.s.hands[x].length !== h.s.hands[y].length || h.s.discard[x].length !== h.s.discard[y].length) continue;
				const h2 = h.clone();
				[h2.s.hands[x], h2.s.hands[y]] = [h2.s.hands[y], h2.s.hands[x]];
				[h2.s.discard[x], h2.s.discard[y]] = [h2.s.discard[y], h2.s.discard[x]];
				const v1 = h.view(q);
				const v2 = h2.view(q);
				if (!same(v1, v2)) continue; // a swap that shows (a partner, a side): not a hidden one
				const a = chooseAction({ game: g, view: v1, level: tiny, seed: 'v' });
				const b = chooseAction({ game: g, view: v2, level: tiny, seed: 'v' });
				assert.deepEqual(a, b);
				swapped++;
				return;
			}
		}, 4);
		assert.ok(swapped > 0 || n === 2, 'no hidden swap was possible');
	});

	test(`${id}:${n} worlds are built for 90 percent of 200 plays`, () => {
		let ok = 0;
		let tot = 0;
		walk(g, 'W', 200, (h, q) => {
			const v = h.view(q);
			if (v.legal[0].type !== 'play') return;
			tot++;
			const info = prepare(g, v);
			if (info.ok && sampleWorld(g, v, info, level('normal'), makeRng, 'w', 0)) ok++;
		}, 2);
		assert.ok(tot > 50, 'too few plays reached');
		assert.ok(ok >= tot * 0.9, `${ok} of ${tot}`);
	});
}

test('the bid policy never bids without a trump above 10', () => {
	const g = game('permesso_3', 3);
	const ctx = ctxOf(g);
	const legal = [{ type: 'pass' }, ...ctx.contracts.map((c) => ({ type: 'bid_' + c.id }))];
	const low = ['swords:K', 'batons:K', 'cups:K', 'coins:K', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'swords:Q', 'batons:Q', 'cups:Q', 'coins:Q'];
	assert.equal(bidAction(ctx, low, legal).type, 'pass');
	const rng = makeRng('bid');
	for (let i = 0; i < 300; i++) { // random hands: a bid always comes with three trumps above 10
		const deck = [...low, 'T11', 'T12', 'T13', 'T14', 'T15', 'T16', 'T17', 'T18', 'T19', 'T20', 'T21'];
		const hand = deck.filter(() => rng.next() < 0.5);
		if (bidAction(ctx, hand, legal).type !== 'pass') assert.ok(hand.filter((c) => c.startsWith('T') && Number(c.slice(1)) > 10).length >= 3);
	}
	const strong = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14', 'T13', 'swords:K', 'cups:K', 'coins:K', 'T10', 'T9', 'T8', 'T7', 'T6', 'T5'];
	assert.ok(worthOf(strong) > worthOf(low));
	assert.notEqual(bidAction(ctx, strong, legal).type, 'pass');
});

test('policies of the exchange: lay the cheapest plain card, never lay_done while a card can be laid, call a partner not of the own hand', () => {
	const g = game('permesso_3', 3);
	const ctx = ctxOf(g);
	const hand = ['T21', 'swords:2', 'swords:K', 'cups:9', 'cups:8', 'coins:Q'];
	const legal = [...hand.filter((c) => c !== 'swords:K').map((card) => ({ type: 'lay_down', card })), { type: 'lay_done' }];
	assert.equal(layAction(ctx, hand, legal).type, 'lay_down');
	assert.notEqual(layAction(ctx, hand, legal).card, 'T21');
	const cp = [{ type: 'call_partner', card: 'swords:K' }, { type: 'call_partner', card: 'cups:K' }];
	assert.equal(callPartnerAction(ctx, ['swords:K', 'swords:2', 'swords:3', 'cups:2'], cp).card, 'cups:K');
	assert.equal(declareAction([{ type: 'declare_done' }, { type: 'declare_onori' }]).type, 'declare_onori');
	assert.equal(declareAction([{ type: 'declare_done' }]).type, 'declare_done');
});
