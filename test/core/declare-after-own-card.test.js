// Mitigati for two: the card a seat has put into the first trick still counts when it declares before the trick is
// closed (Torino 1787, p. 86). The window after the discards and before the first card is not changed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { compileSelector } from '../../core/selectors.js';
import { kindAmount } from '../../core/modules/declarations.js';
import { chooseAction } from '../../bots/random.js';
import { loadPatched } from './declaration-helpers.js';

const exact = (f) => { f.hand.phases.find((p) => p.id === 'discard_first').settings.count_mode.value = 'exact'; };
const game = loadPatched('mitigati_2', 2, exact);
const kinds = game.plan.find((e) => e.module === 'declarations').set.kinds;
const preds = Object.fromEntries(kinds.map((k) => [k.id, compileSelector(k.of, game.env)]));
const SEEDS = 120;

function toTricks(i) {
	const h = newHand(game, { seed: 'v' + i, dealer: i % 2 });
	const rng = makeRng('r' + i);
	while (h.cur.module !== 'tricks') { const q = h.toAct()[0]; assert.ok(h.apply(q, chooseAction(h.legal(q), rng)).ok); }
	return h;
}
const paidFor = (h, kid, seat) => h.s.m.declarations.paid.filter((p) => p.kind === kid && p.to === seat).reduce((a, p) => a + p.amount, 0);

// each seat plays a card of a kind it holds, then declares in the closing window
test('declared after its own card, every kind is counted with that card', () => {
	let cases = 0;
	let underpaid = 0;
	let lost = 0;
	for (let i = 0; i < SEEDS; i++) {
		const h = toTricks(i);
		const before = [h.s.hands[0].slice(), h.s.hands[1].slice()];
		let guard = 0;
		while (h.s.tricks.length === 0 && guard++ < 50) {
			const q = h.toAct()[0];
			const legal = h.legal(q);
			if (h.s.m.tricks.closing) {
				const dec = legal.find((a) => a.type.startsWith('declare_') && a.type !== 'declare_done');
				if (!dec) { assert.ok(h.apply(q, legal[0]).ok); continue; }
				const kid = dec.type.slice(8);
				const k = kinds.find((x) => x.id === kid);
				const n0 = paidFor(h, kid, q);
				assert.ok(h.apply(q, dec).ok);
				const due = kindAmount(k, before[q].filter(preds[kid]).length, game.options);
				if (paidFor(h, kid, q) - n0 !== due) underpaid++;
				cases++;
				continue;
			}
			const plays = legal.filter((a) => a.type === 'play');
			const held = kinds.filter((k) => before[q].filter(preds[k.id]).length >= k.min);
			let pick = null;
			for (const k of held) { pick = plays.find((a) => preds[k.id](a.card)); if (pick) break; }
			assert.ok(h.apply(q, pick || plays[0]).ok);
		}
		for (let q = 0; q < 2; q++) for (const k of kinds) {
			const n = before[q].filter(preds[k.id]).length;
			const ok = n >= k.min && (!k.all_of || n === 3);
			if (ok && !h.s.m.declarations.made.some((d) => d.seat === q && d.kind === k.id)) lost++;
		}
	}
	assert.ok(cases > 50, 'the scenario declares: ' + cases);
	assert.equal(underpaid, 0, 'declarations paid less than the hand held');
	assert.equal(lost, 0, 'kinds held at the deal that could not be declared');
});

test('five honours, one of them played: the closing window pays for five', () => {
	let found = 0;
	for (let i = 0; i < 400 && found < 3; i++) {
		const h = toTricks(i);
		const lead = h.toAct()[0];
		const hand = h.s.hands[lead];
		if (hand.filter(preds.onori).length < 5) continue;
		const n = hand.filter(preds.onori).length;
		const card = h.legal(lead).find((a) => a.type === 'play' && preds.onori(a.card));
		assert.ok(h.apply(lead, card).ok);
		const other = 1 - lead;
		assert.ok(h.apply(other, h.legal(other).find((a) => a.type === 'play')).ok);
		assert.equal(h.s.tricks.length, 0);
		assert.ok(h.legal(lead).some((a) => a.type === 'declare_onori'));
		assert.ok(h.apply(lead, { type: 'declare_onori' }).ok);
		const k = kinds.find((x) => x.id === 'onori');
		assert.equal(h.s.m.declarations.made.find((d) => d.kind === 'onori').n, n);
		assert.equal(paidFor(h, 'onori', lead), kindAmount(k, n, game.options));
		found++;
	}
	assert.ok(found > 0, 'a hand with five honours was found');
});

test('exactly three honours, one played: it can still be declared (three)', () => {
	let found = 0;
	for (let i = 0; i < 600 && found < 3; i++) {
		const h = toTricks(i);
		const lead = h.toAct()[0];
		if (h.s.hands[lead].filter(preds.onori).length !== 3) continue;
		const card = h.legal(lead).find((a) => a.type === 'play' && preds.onori(a.card));
		if (!card) continue;
		assert.ok(h.apply(lead, card).ok);
		const other = 1 - lead;
		assert.ok(h.apply(other, h.legal(other).find((a) => a.type === 'play')).ok);
		assert.ok(h.legal(lead).some((a) => a.type === 'declare_onori'), 'three honours still on offer');
		assert.ok(h.apply(lead, { type: 'declare_onori' }).ok);
		assert.equal(h.s.m.declarations.made.find((d) => d.kind === 'onori').n, 3);
		found++;
	}
	assert.ok(found > 0);
});

test('declared before its own card the payments are the ones of the hand; a card played later changes nothing', () => {
	for (let i = 0; i < 60; i++) {
		const h = toTricks(i);
		const lead = h.toAct()[0];
		const held = kinds.map((k) => ({ k, n: h.s.hands[lead].filter(preds[k.id]).length })).filter((x) => x.n >= x.k.min && !x.k.all_of);
		if (!held.length) continue;
		const { k, n } = held[0];
		assert.ok(h.apply(lead, { type: 'declare_' + k.id }).ok);
		assert.equal(h.s.m.declarations.made.find((d) => d.kind === k.id).n, n);
		assert.equal(paidFor(h, k.id, lead), kindAmount(k, n, game.options));
	}
});
