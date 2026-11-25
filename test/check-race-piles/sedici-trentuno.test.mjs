// Independent check of the race and piles games: Sedici and Trent'uno for two, played rule by rule against the files and the decisions recorded in REVISIONS.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from '../../core/index.js';
import { load, getFile, fresh, setHands, giveWon, must, playOut, rightClaim, makeRng, value } from './lib.mjs';

// revision 9: the file says claim_when own_turn; the window «only the taker, right after a trick» is the alt after_trick, patched in here
const afterTrick = (id) => loadGame(id, (x) => { const f = getFile(x); if (x === id) f.hand.phases.find((p) => p.id === 'fuora').settings.claim_when.value = 'after_trick'; return f; }, { seats: 2 });
const GAMES = [['sedici_2', 4, 16], ['trentuno', 8, 31]];
const plays = (h, seat) => h.legal(seat).filter((a) => a.type === 'play').map((a) => a.card).sort();
const SW = (r) => 'swords:' + r;
const CU = (r) => 'cups:' + r;
const CO = (r) => 'coins:' + r;
const BA = (r) => 'batons:' + r;

// a hand of `size` cards: the given ones, filled with plain batons
const fill = (size, cards, from = 2) => {
	const out = cards.slice();
	for (let r = from; out.length < size; r++) out.push(BA(r));
	return out;
};

for (const [id, size, target] of GAMES) {
	test(`${id}: the first deal gives ${size} cards each, the rest stays as a stock`, () => {
		const h = fresh(load(id));
		assert.equal(h.s.hands[0].length, size);
		assert.equal(h.s.hands[1].length, size);
		assert.equal(h.s.rest.length, 78 - 2 * size);
		assert.deepEqual(h.view(0).round, { index: 0, stock: 78 - 2 * size });
	});

	test(`${id}: a later round deals the next cards of the same stock, no shuffle, and the first round is led by seat 1 (dealer's right), each later one by the taker of the last trick (round_last_taker)`, () => {
		const h = fresh(load(id), 'rounds');
		const rng = makeRng('r');
		let checked = 0;
		let restBefore = null;
		while (!h.isOver() && checked < 3) {
			const seat = h.toAct()[0];
			const L = h.legal(seat).filter((a) => a.type === 'play');
			if (!L.length) { must(h.apply(seat, { type: 'claim_fuora' })); continue; }
			restBefore = h.s.rest.slice();
			const r = must(h.apply(seat, L[rng.int(L.length)]));
			if (r.events.some((e) => e.e === 'round_dealt')) {
				const dealt = restBefore.slice(0, 2 * size).sort();
				assert.deepEqual([...h.s.hands[0], ...h.s.hands[1]].sort(), dealt, 'the round deals the top of the stock');
				assert.deepEqual(h.s.rest, restBefore.slice(2 * size), 'the stock keeps its order');
				assert.deepEqual(h.toAct(), [h.s.tricks[h.s.tricks.length - 1].winner], 'the taker of the last trick leads the new round');
				assert.equal(h.s.dealer, 0);
				checked++;
			}
		}
		assert.ok(checked >= 1, 'at least one later round was seen');
	});

	test(`${id}: follow suit, then must trump, no duty to overtrump`, () => {
		const h = fresh(load(id));
		setHands(h, { 1: fill(size, [SW(5)]), 0: fill(size, [SW(2), 'T5', CU(3)], 3) });
		must(h.apply(1, { type: 'play', card: SW(5) }));
		assert.deepEqual(plays(h, 0), [SW(2)]);

		const h2 = fresh(load(id));
		setHands(h2, { 1: fill(size, [CO(5)]), 0: fill(size, ['T5', CU(3)], 3) });
		must(h2.apply(1, { type: 'play', card: CO(5) }));
		assert.deepEqual(plays(h2, 0), ['T5'], 'no coins: must trump');

		const h3 = fresh(load(id));
		setHands(h3, { 1: fill(size, ['T10']), 0: fill(size, ['T3', 'T12']) });
		must(h3.apply(1, { type: 'play', card: 'T10' }));
		assert.deepEqual(plays(h3, 0), ['T12', 'T3'], 'a lower trionfo may be played');
	});

	test(`${id}: the Fool is the lowest trionfo: a lone Fool answers a trump lead, Bagatto takes it, it takes a plain card, worth 1`, () => {
		const g = load(id);
		assert.equal(value(g, 'T0'), 1);
		const h = fresh(g);
		setHands(h, { 1: fill(size, ['T5']), 0: fill(size, ['T0', CU(3)], 3) });
		must(h.apply(1, { type: 'play', card: 'T5' }));
		assert.deepEqual(plays(h, 0), ['T0'], 'the lone Fool must answer a trionfo');

		const h2 = fresh(g);
		setHands(h2, { 1: fill(size, ['T0']), 0: fill(size, ['T1']) });
		must(h2.apply(1, { type: 'play', card: 'T0' }));
		assert.deepEqual(plays(h2, 0), ['T1'], 'a Fool lead is a trump lead');
		must(h2.apply(0, { type: 'play', card: 'T1' }));
		assert.equal(h2.s.tricks[0].winner, 0, 'Bagatto takes the Fool');
		assert.ok(h2.s.won[0].includes('T0'), 'the Fool goes to the taker, it is not kept');
		assert.equal(h2.s.foolGive, null);

		const h3 = fresh(g);
		setHands(h3, { 1: fill(size, [CU('K')]), 0: fill(size, ['T0', SW(3)], 3) });
		must(h3.apply(1, { type: 'play', card: CU('K') }));
		assert.deepEqual(plays(h3, 0), ['T0'], 'no cups: the Fool trumps');
		must(h3.apply(0, { type: 'play', card: 'T0' }));
		assert.equal(h3.s.tricks[0].winner, 0, 'the Fool takes the king');
		assert.equal(h3.view(0).points.mine, 6, 'king 5 + Fool 1');
	});

	test(`${id}, alt after_trick: the claim window: only the taker, right after the trick, gone once he plays`, () => {
		const h = fresh(afterTrick(id));
		assert.ok(!h.legal(1).some((a) => a.type === 'claim_fuora'), 'no claim before any trick');
		setHands(h, { 1: fill(size, [CU('K')]), 0: fill(size, ['T7']) });
		must(h.apply(1, { type: 'play', card: CU('K') }));
		assert.ok(!h.legal(1).some((a) => a.type === 'claim_fuora'), 'no claim inside a trick');
		must(h.apply(0, { type: 'play', card: 'T7' }));
		assert.deepEqual(h.toAct(), [0]);
		assert.ok(h.legal(0).some((a) => a.type === 'claim_fuora'), 'the taker may claim');
		assert.deepEqual(h.legal(1), [], 'the other seat may not');
		assert.equal(h.apply(1, { type: 'claim_fuora' }).ok, false);
		assert.equal(h.view(0).fuora.canClaim, true);
		assert.equal(h.view(1).fuora.canClaim, false);
		const card = plays(h, 0)[0];
		must(h.apply(0, { type: 'play', card }));
		assert.ok(!h.legal(0).some((a) => a.type === 'claim_fuora'), 'the window is closed');
	});

	test(`${id}: a right claim ends the partita: winner, reason, one game point, the stake paid`, () => {
		const h = fresh(load(id));
		setHands(h, { 1: fill(size, [CU('K')]), 0: fill(size, ['T7']) });
		must(h.apply(1, { type: 'play', card: CU('K') }));
		must(h.apply(0, { type: 'play', card: 'T7' }));
		h.s.rest.push(...h.s.won[0].splice(0));
		giveWon(h, 0, target);
		const r = must(h.apply(0, { type: 'claim_fuora' }));
		assert.ok(r.events.some((e) => e.e === 'fuora_claimed' && e.valid && e.points === target));
		assert.ok(h.isOver());
		const res = h.result();
		assert.deepEqual(res.winners, [0]);
		assert.equal(res.reason, 'fuora');
		assert.deepEqual(res.gamePoints, { 0: 1, 1: 0 });
		assert.deepEqual(res.payments.map((p) => [p.from, p.to, p.amount]), [[1, 0, 1]]);
	});
}

// every false-claim row: [game, points, stake, game points to the other seat, payment]
const ROWS = [
	['sedici_2', 7, 'marcia', 2, 2], ['sedici_2', 8, 'simple', 1, 1], ['sedici_2', 9, 'simple', 1, 1],
	['trentuno', 15, 'double', 2, 2], ['trentuno', 16, 'simple', 1, 1],
];
for (const [id, pts, stake, gp, pay] of ROWS) {
	test(`${id}: a false fuora with ${pts} points pays ${stake} (${pay}) and gives ${gp} game points; play goes on`, () => {
		const g = load(id);
		const size = id === 'sedici_2' ? 4 : 8;
		const h = fresh(g, 'false' + pts);
		setHands(h, { 1: fill(size, [CU('K')]), 0: fill(size, ['T7']) });
		must(h.apply(1, { type: 'play', card: CU('K') }));
		must(h.apply(0, { type: 'play', card: 'T7' }));
		h.s.rest.push(...h.s.won[0].splice(0));
		giveWon(h, 0, pts);
		const r = must(h.apply(0, { type: 'claim_fuora' }));
		assert.ok(r.events.some((e) => e.e === 'fuora_claimed' && e.valid === false && e.points === pts));
		assert.equal(h.isOver(), false, 'play_on');
		assert.deepEqual(h.toAct(), [0], 'the claimer still leads');
		assert.ok(h.legal(0).every((a) => a.type === 'play'), 'no second claim in the same window');
		assert.deepEqual(h.view(1).fuora.claims, [{ seat: 0, valid: false, points: pts }]);
		playOut(h, makeRng('po' + pts), { claimOk: rightClaim });
		const res = h.result();
		const fc = res.payments.filter((p) => p.why === 'false_claim');
		assert.deepEqual(fc.map((p) => [p.from, p.to, p.amount]), [[0, 1, pay]]);
		const won = (q) => (res.winners.includes(q) ? 1 : 0);
		assert.equal(res.gamePoints[1], won(1) + gp, 'the other seat gets the false-claim points');
		assert.equal(res.gamePoints[0], won(0));
	});
}

test('sedici_2: the pack runs out: no winner, outcome none, no stake, no game points', () => {
	const g = load('sedici_2');
	const h = fresh(g, 'empty');
	setHands(h, { 1: [BA(2), BA(3), BA(4), BA(5)], 0: [BA(6), BA(7), BA(8), BA(9)] });
	// keep a stock of 5 cards: the next round cannot be dealt (test surgery: the rest is parked in a discard)
	h.s.discard[1].push(...h.s.rest.splice(5));
	const events = [];
	playOut(h, makeRng('e'), { claimOk: () => false, each: (hh, s, a, ev) => events.push(...ev) });
	const res = h.result();
	assert.ok(events.some((e) => e.e === 'stock_empty'));
	assert.deepEqual(res.winners, []);
	assert.equal(res.outcome, 'none');
	assert.equal(res.reason, 'stock_empty');
	assert.deepEqual(res.payments, []);
	assert.deepEqual(res.gamePoints, { 0: 0, 1: 0 });
});

test('sedici_2: after the last trick of a round only the taker who is out is held for his claim, before the next deal', () => {
	const g = load('sedici_2');
	const h = fresh(g, 'last');
	setHands(h, { 1: [BA(2), BA(3), BA(4), BA(5)], 0: [BA(6), BA(7), BA(8), BA(9)] });
	giveWon(h, 0, 16);
	giveWon(h, 1, 16);
	for (let i = 0; i < 7; i++) {
		const seat = h.toAct()[0];
		const p = h.legal(seat).find((a) => a.type === 'play');
		must(h.apply(seat, p || { type: 'play', card: plays(h, seat)[0] }));
	}
	const seat = h.toAct()[0];
	must(h.apply(seat, h.legal(seat).find((a) => a.type === 'play')));
	const taker = h.s.tricks[h.s.tricks.length - 1].winner;
	assert.equal(h.s.round, 0, 'no new deal yet');
	assert.deepEqual(h.toAct(), [taker]);
	assert.deepEqual(h.legal(taker), [{ type: 'claim_fuora' }]);
	assert.deepEqual(h.legal(1 - taker), []);
});
