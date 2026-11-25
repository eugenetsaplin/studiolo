// The open piles of Baronetti: legal cards, the reveal after a trick, empty piles, showing the Fool, secrecy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, replayHand, DECK, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { load, checkConserved } from './helpers.js';

const game = () => load('baronetti', 2);
// revision 9: the Fool is played in place of a card (fool_show_any_time false); showing it on one's own turn is the alt
const gameShow = () => load('baronetti', 2, { alts: ['cards.fool_show_any_time'] });
const tops = (h, seat) => h.s.piles[seat].map((p) => (p.open && p.cards.length ? p.cards[p.cards.length - 1] : null)).filter(Boolean);

function playAll(h, seed) {
	const rng = makeRng('piles:' + seed);
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 400) throw new Error('does not end');
		const seat = h.toAct()[0];
		const a = chooseAction(h.legal(seat), rng);
		assert.ok(h.apply(seat, a).ok);
	}
	return h;
}

test('only open tops are legal, with follow suit and trump among them', () => {
	const g = game();
	for (const seed of ['p1', 'p2', 'p3']) {
		const h = newHand(g, { seed, dealer: 0 });
		const lead = h.toAct()[0];
		const open = tops(h, lead);
		assert.deepEqual(h.legal(lead).filter((a) => a.type === 'play').map((a) => a.card).sort(), [...open].sort());
		assert.deepEqual(h.view(lead).hand.slice().sort(), [...open].sort());
		assert.equal(h.view(lead).handCounts[lead], 39);
		const card = open[0];
		assert.ok(h.apply(lead, { type: 'play', card }).ok);
		const other = h.toAct()[0];
		const mine = tops(h, other);
		const legal = h.legal(other).filter((a) => a.type === 'play').map((a) => a.card);
		assert.ok(legal.every((c) => mine.includes(c)), 'only open cards');
		assert.ok(legal.length >= 1);
	}
});

test('after a trick each seat turns the next card of the pile it played from', () => {
	const g = game();
	const h = newHand(g, { seed: 'rev', dealer: 0 });
	const lead = h.toAct()[0];
	const a = h.legal(lead).find((x) => x.type === 'play');
	const pileA = h.s.piles[lead].findIndex((p) => p.cards[p.cards.length - 1] === a.card);
	const nextA = h.s.piles[lead][pileA].cards.at(-2);
	const sizeA = h.s.piles[lead][pileA].cards.length;
	h.apply(lead, a);
	assert.equal(h.view(lead).open_piles.piles[lead][pileA].top, null, 'covered until the trick is over');
	assert.equal(h.view(lead).open_piles.piles[lead][pileA].size, sizeA - 1);
	const other = h.toAct()[0];
	const b = h.legal(other).find((x) => x.type === 'play');
	const pileB = h.s.piles[other].findIndex((p) => p.cards[p.cards.length - 1] === b.card);
	const nextB = h.s.piles[other][pileB].cards.at(-2);
	const r = h.apply(other, b);
	const rev = r.events.filter((e) => e.e === 'pile_revealed');
	assert.deepEqual(rev.map((e) => [e.seat, e.pile, e.card]).sort(), [[lead, pileA, nextA], [other, pileB, nextB]].sort());
	assert.equal(h.view(other).open_piles.piles[lead][pileA].top, nextA, 'both seats see the turned card');
	assert.ok(h.s.piles[lead][pileA].open && h.s.piles[other][pileB].open);
});

test('every pile is played to empty; whole hands to the result, replay equal', () => {
	const g = game();
	for (const seed of ['w1', 'w22', 'w3', 'w44', 'w5', 'w66']) {
		const h = newHand(g, { seed, dealer: seed.length % 2 });
		playAll(h, seed);
		assert.ok(h.s.piles.every((l) => l.every((p) => p.cards.length === 0)));
		const all = [...h.s.won[0], ...h.s.won[1]];
		assert.equal(new Set(all).size, 78, 'every card is won by somebody');
		assert.ok(h.result());
		const init = { seed, dealer: h.s.dealer };
		assert.equal(replayHand(g, init, h.log).checksum(), h.checksum());
	}
});

// the Fool laid at the top (open) or at the bottom (covered) of the first pile of foolSeat
function foolHand(foolSeat, covered, g = game) {
	const deck = DECK.slice();
	const piles = { 0: [], 1: [] };
	for (const size of [10, 10, 10, 9]) for (const seat of [1, 0]) piles[seat].push(deck.splice(0, size));
	let from = null;
	for (const seat of [0, 1]) piles[seat].forEach((pl, i) => { const j = pl.indexOf('T0'); if (j >= 0) from = { seat, i, j }; });
	const a = piles[from.seat][from.i];
	const b = piles[foolSeat][0];
	const j = covered ? 0 : b.length - 1;
	[a[from.j], b[j]] = [b[j], a[from.j]];
	return newHand(g(), { seed: 'fool', dealer: 0, preset: { piles, rest: [] } });
}

test('the file (revision 9) offers no show_fool: the Fool is played into a trick', () => {
	for (const foolSeat of [1, 0]) {
		const h = foolHand(foolSeat, false);
		assert.equal(h.legal(h.toAct()[0]).some((a) => a.type === 'show_fool'), false);
	}
});

test('alt: show_fool is offered to the seat to act when the Fool is open, and not when it is covered', () => {
	for (const foolSeat of [1, 0]) {
		const h = foolHand(foolSeat, false, gameShow);
		const turn = h.toAct()[0];
		assert.equal(turn, 1);
		const has = (seat) => h.legal(seat).some((a) => a.type === 'show_fool');
		assert.equal(has(foolSeat), foolSeat === turn, 'only on its own turn');
		assert.equal(has(1 - foolSeat), false);
		const c = foolHand(foolSeat, true, gameShow);
		assert.equal(c.legal(1).some((a) => a.type === 'show_fool'), false, 'covered');
		assert.equal(c.legal(0).some((a) => a.type === 'show_fool'), false);
	}
});

test('alt: show_fool lays the Fool among the won cards, turns the next card at once, and keeps the turn', () => {
	const h = foolHand(1, false, gameShow);
	const pile = h.s.piles[1].findIndex((p) => p.cards.at(-1) === 'T0');
	const next = h.s.piles[1][pile].cards.at(-2);
	const r = h.apply(1, { type: 'show_fool', card: 'T0' });
	assert.ok(r.ok);
	assert.deepEqual(r.events.map((e) => e.e), ['fool_shown', 'pile_revealed']);
	assert.equal(r.events[1].card, next);
	assert.deepEqual(h.toAct(), [1], 'the seat keeps its turn');
	assert.ok(h.s.won[1].includes('T0'));
	assert.deepEqual(h.s.shown[1], ['T0']);
	assert.equal(h.s.hands[1].length, 38);
	const v = h.view(0);
	assert.deepEqual(v.open_piles.shown[1], ['T0']);
	assert.equal(v.open_piles.piles[1][pile].top, next);
	assert.equal(v.handCounts[1], 38);
	assert.equal(h.legal(1).some((a) => a.type === 'show_fool'), false);
	checkConserved(h);
	playAll(h, 'after-show');
	assert.equal(new Set([...h.s.won[0], ...h.s.won[1]]).size, 78, 'the odd card of the other seat is kept, nothing is lost');
	assert.ok(h.s.won[1].includes('T0'));
});

test('the Fool can instead be played as the excuse and goes back to its owner', () => {
	const h = foolHand(1, false);
	assert.ok(h.apply(1, { type: 'play', card: 'T0' }).ok);
	assert.ok(h.apply(0, h.legal(0).find((a) => a.type === 'play')).ok);
	assert.ok(h.s.won[1].includes('T0'));
	assert.equal(h.s.shown[1].length, 0);
});

test("covered cards are secret, the owner's too: swapping them changes no view", () => {
	const g = game();
	const rng = makeRng('swap');
	for (const seed of ['z1', 'z2', 'z3']) {
		const h = newHand(g, { seed, dealer: 0 });
		let guard = 0;
		while (!h.isOver() && guard++ < 200) {
			const copy = h.clone();
			const slots = [];
			copy.s.piles.forEach((l, q) => l.forEach((p) => p.cards.forEach((c, i) => { if (!(p.open && i === p.cards.length - 1)) slots.push({ q, p, i }); })));
			const cards = slots.map((x) => x.p.cards[x.i]).reverse();
			slots.forEach((x, k) => { x.p.cards[x.i] = cards[k]; });
			for (let q = 0; q < 2; q++) copy.s.hands[q] = copy.s.piles[q].flatMap((p) => p.cards);
			for (let q = 0; q < 2; q++) assert.equal(JSON.stringify(copy.view(q)), JSON.stringify(h.view(q)));
			const seat = h.toAct()[0];
			h.apply(seat, chooseAction(h.legal(seat), rng));
		}
	}
});
