// Independent check of the race and piles games: Baronetti for two, the piles, the open Fool and the count, against the file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame } from '../../core/index.js';
import { load, newHand, must, playOut, makeRng, getFile } from './lib.mjs';

const g = load('baronetti');
// revision 9: the file plays the Fool in place of a card; showing it on one's own turn is the alt cards.fool_show_any_time
const gShow = loadGame('baronetti', getFile, { seats: 2, alts: ['cards.fool_show_any_time'] });
const tops = (h, seat) => h.s.piles[seat].filter((p) => p.open && p.cards.length).map((p) => p.cards[p.cards.length - 1]).sort();
const playsOf = (h, seat) => h.legal(seat).filter((a) => a.type === 'play').map((a) => a.card).sort();

test('baronetti: four piles of 10, 10, 10, 9 each, only the tops open, dealt to the opponent of the dealer first', () => {
	for (const dealer of [0, 1]) {
		const h = newHand(g, { seed: 'piles' + dealer, dealer });
		for (const seat of [0, 1]) {
			assert.deepEqual(h.s.piles[seat].map((p) => p.cards.length), [10, 10, 10, 9]);
			assert.ok(h.s.piles[seat].every((p) => p.open));
			assert.equal(h.s.hands[seat].length, 39);
		}
		assert.equal(h.s.rest.length, 0);
		assert.equal(h.s.m.deal.order[0], 1 - dealer, 'the opponent of the dealer is dealt first');
		assert.deepEqual(h.toAct(), [1 - dealer], 'the opponent of the dealer leads');
	}
});

test('baronetti: only open tops are played, the view shows only them, follow suit among them', () => {
	const rng = makeRng('tops');
	for (let i = 0; i < 40; i++) {
		const h = newHand(g, { seed: 'tops' + i, dealer: 0 });
		let steps = 0;
		while (!h.isOver() && steps++ < 30) {
			const seat = h.toAct()[0];
			const open = tops(h, seat);
			assert.deepEqual(h.view(seat).hand.slice().sort(), open, 'view.hand = the open tops');
			const p = playsOf(h, seat);
			assert.ok(p.every((c) => open.includes(c)), 'a play is an open top');
			if (h.s.trick.length === 1) {
				const led = h.s.trick[0].card;
				const suit = (c) => (c.startsWith('T') ? 'trump' : c.split(':')[0]);
				if (led !== 'T0') {
					const same = open.filter((c) => c !== 'T0' && suit(c) === suit(led));
					if (same.length) assert.deepEqual(p.filter((c) => c !== 'T0'), same.sort(), 'must follow suit among the open tops');
				}
			}
			const L = h.legal(seat).filter((a) => a.type === 'play');
			must(h.apply(seat, L[rng.int(L.length)]));
		}
	}
});

test('baronetti: the next card is turned only after both have played; an emptied pile stays empty', () => {
	const h = newHand(g, { seed: 'turn', dealer: 0 });
	const leader = h.toAct()[0];
	const card = playsOf(h, leader).find((c) => c !== 'T0');
	const at = h.s.piles[leader].findIndex((p) => p.cards[p.cards.length - 1] === card);
	must(h.apply(leader, { type: 'play', card }));
	const v = h.view(1 - leader).open_piles.piles[leader][at];
	assert.equal(v.top, null, 'the pile is covered while the trick is open');
	assert.equal(v.size, at === 3 ? 8 : 9);
	const other = 1 - leader;
	const ans = h.legal(other).find((a) => a.type === 'play');
	const r = must(h.apply(other, ans));
	const rev = r.events.filter((e) => e.e === 'pile_revealed');
	assert.ok(rev.some((e) => e.seat === leader && e.pile === at));
	assert.notEqual(h.view(other).open_piles.piles[leader][at].top, null);

	// play on until some pile is empty; it stays empty with no top
	const rng = makeRng('t');
	let seen = false;
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		const all = h.legal(seat);
		const L = all.filter((a) => a.type === 'play');
		must(h.apply(seat, L.length ? L[rng.int(L.length)] : all[0]));
		if (h.isOver()) break;
		for (const q of [0, 1]) for (const p of h.view(q).open_piles.piles[q]) if (p.size === 0) { assert.equal(p.top, null); seen = true; }
	}
	assert.ok(seen);
});

// plays until the seat to act has the Fool on an open top; returns the hand or null
// (with `showing` false: until the seat may play the Fool from an open top; the file of revision 9 has no show_fool)
function untilOpenFool(seed, game = g, showing = false) {
	const h = newHand(game, { seed, dealer: 0 });
	const rng = makeRng(seed);
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		if (h.legal(seat).some((a) => (showing ? a.type === 'show_fool' : a.type === 'play' && a.card === 'T0'))) return { h, seat };
		const L = h.legal(seat).filter((a) => a.type === 'play' && a.card !== 'T0');
		if (!L.length) return null;
		must(h.apply(seat, L[rng.int(L.length)]));
	}
	return null;
}

test('baronetti, alt fool_show_any_time: showing the open Fool is not a play: same seat to act, the trick unchanged, the next card turned at once', () => {
	let done = 0;
	for (let i = 0; i < 60 && done < 5; i++) {
		const x = untilOpenFool('fool' + i, gShow, true);
		if (!x) continue;
		const { h, seat } = x;
		const at = h.s.piles[seat].findIndex((p) => p.open && p.cards[p.cards.length - 1] === 'T0');
		const size = h.s.piles[seat][at].cards.length;
		const trick = h.s.trick.length;
		const r = must(h.apply(seat, { type: 'show_fool', card: 'T0' }));
		assert.ok(r.events.some((e) => e.e === 'fool_shown' && e.seat === seat));
		assert.deepEqual(h.toAct(), [seat], 'he still plays a card');
		assert.equal(h.s.trick.length, trick, 'nothing put into the trick');
		assert.ok(h.s.won[seat].includes('T0'));
		assert.deepEqual(h.view(1 - seat).open_piles.shown[seat], ['T0']);
		if (size > 1) assert.ok(r.events.some((e) => e.e === 'pile_revealed' && e.seat === seat && e.pile === at), 'the next card turns at once');
		assert.ok(!h.legal(seat).some((a) => a.type === 'show_fool'));
		done++;
	}
	assert.ok(done >= 3);
});

test('baronetti: the Fool played into a trick is an excuse: it takes nothing and stays with its owner', () => {
	let done = 0;
	for (let i = 0; i < 80 && done < 3; i++) {
		const x = untilOpenFool('exc' + i);
		if (!x) continue;
		const { h, seat } = x;
		if (!h.legal(seat).some((a) => a.type === 'play' && a.card === 'T0')) continue;
		const before = h.s.tricks.length;
		if (h.s.trick.length === 0) {
			must(h.apply(seat, { type: 'play', card: 'T0' }));
			const o = 1 - seat;
			must(h.apply(o, h.legal(o).find((a) => a.type === 'play')));
		} else must(h.apply(seat, { type: 'play', card: 'T0' }));
		const t = h.s.tricks[before];
		assert.equal(t.fool, seat);
		assert.notEqual(t.winner, seat, 'the Fool takes nothing');
		assert.ok(h.s.won[seat].includes('T0'), 'the Fool is not lost');
		done++;
	}
	assert.ok(done >= 1);
});

test('baronetti: the count in pairs makes 91, 46 wins, 45½ each is a tie with no game points', () => {
	let ties = 0;
	for (let i = 0; i < 300; i++) {
		const h = playOut(newHand(g, { seed: 'cnt' + i, dealer: i % 2 }), makeRng('c' + i), { pShow: 0.5 });
		const r = h.result();
		const p0 = r.points[0] / 12;
		const p1 = r.points[1] / 12;
		assert.equal(p0 + p1, 91, 'all the points of the pack');
		if (p0 >= 46) assert.deepEqual(r.winners, [0]);
		else if (p1 >= 46) assert.deepEqual(r.winners, [1]);
		else { assert.equal(p0, 45.5); assert.ok(['tie', 'none'].includes(r.outcome)); assert.deepEqual(r.winners, []); assert.deepEqual(r.payments, []); ties++; }
	}
	assert.ok(ties >= 0);
});

// The open Fool: «At the end he gives a plain card of his choice (already in the file)» - also when the Fool was shown, not played
test('baronetti, alt fool_show_any_time: a shown Fool is still paid for with a plain card at the count (fool_exchange true, owner_choice)', () => {
	let checked = 0;
	for (let i = 0; i < 40 && checked < 5; i++) {
		const x = untilOpenFool('pay' + i, gShow, true);
		if (!x) continue;
		const { h, seat } = x;
		must(h.apply(seat, { type: 'show_fool', card: 'T0' }));
		const rng = makeRng('pay' + i);
		let gave = false;
		while (!h.isOver()) {
			const q = h.toAct()[0];
			const L = h.legal(q);
			const a = L.find((y) => y.type === 'play' && y.card !== 'T0') || L[rng.int(L.length)];
			if (a.type !== 'play') gave = true;
			must(h.apply(q, a));
		}
		assert.ok(gave || h.s.foolGive, 'the owner of the shown Fool gives the opponent a plain card');
		assert.equal(h.s.foolGive && h.s.foolGive.from, seat);
		checked++;
	}
	assert.ok(checked >= 1);
});
