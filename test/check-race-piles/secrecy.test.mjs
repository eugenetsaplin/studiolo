// Independent check of the race and piles games: secrecy. Pairs of states that differ only in what a seat may not know give the same view.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, newHand, must, makeRng } from './lib.mjs';

const J = (x) => JSON.stringify(x);

// plays k random actions (claims and shows included)
function advance(h, rng, k) {
	for (let i = 0; i < k && !h.isOver(); i++) {
		const seat = h.toAct()[rng.int(h.toAct().length)];
		const L = h.legal(seat);
		must(h.apply(seat, L[rng.int(L.length)]));
	}
}

for (const id of ['sedici_2', 'trentuno']) {
	test(`${id}: the order of the stock and the other hand do not change a seat's view`, () => {
		const g = load(id);
		let n = 0;
		for (let i = 0; i < 150; i++) {
			const h = newHand(g, { seed: 'sec' + i, dealer: i % 2 });
			const rng = makeRng('sec' + i);
			advance(h, rng, rng.int(40));
			if (h.isOver()) continue;
			for (const seat of [0, 1]) {
				const other = 1 - seat;
				const b = h.clone();
				// swap the other hand with the top of the stock and reverse the stock
				const k = Math.min(b.s.hands[other].length, b.s.rest.length);
				const theirs = b.s.hands[other].splice(0, k);
				const stock = b.s.rest.splice(0, k);
				b.s.hands[other].push(...stock);
				b.s.rest.push(...theirs);
				b.s.rest.reverse();
				// legal and toAct of the other seat may differ; the seat's own view must not
				const va = h.view(seat);
				const vb = b.view(seat);
				if (h.toAct().includes(other)) { delete va.legal; delete vb.legal; }
				assert.equal(J(vb), J(va));
				n++;
			}
		}
		assert.ok(n > 100);
	});
}

test('baronetti: covered pile cards (own and other) do not change any view', () => {
	const g = load('baronetti');
	let n = 0;
	for (let i = 0; i < 150; i++) {
		const h = newHand(g, { seed: 'bsec' + i, dealer: i % 2 });
		const rng = makeRng('bsec' + i);
		advance(h, rng, rng.int(60));
		if (h.isOver()) continue;
		const b = h.clone();
		// every covered card of both seats, shuffled among the covered places
		const places = [];
		for (const q of [0, 1]) b.s.piles[q].forEach((p, pi) => p.cards.forEach((c, ci) => {
			const top = ci === p.cards.length - 1;
			if (!(top && p.open)) places.push({ q, pi, ci, c });
		}));
		const cards = places.map((x) => x.c);
		for (let j = cards.length - 1; j > 0; j--) { const r = rng.int(j + 1); [cards[j], cards[r]] = [cards[r], cards[j]]; }
		places.forEach((x, j) => { b.s.piles[x.q][x.pi].cards[x.ci] = cards[j]; });
		for (const q of [0, 1]) b.s.hands[q] = b.s.piles[q].flatMap((p) => p.cards).sort();
		// the cards a seat owns may now differ in number only if covered cards moved between seats: keep the counts
		if (b.s.hands[0].length !== h.s.hands[0].length) continue;
		for (const seat of [0, 1]) {
			const va = h.view(seat);
			const vb = b.view(seat);
			assert.equal(J(vb), J(va), 'view of seat ' + seat);
		}
		n++;
	}
	assert.ok(n > 50);
});

test('the journal events tell only what the table shows: pile_revealed names an open card, fuora_claimed the claimer\'s count', () => {
	const g = load('baronetti');
	for (let i = 0; i < 30; i++) {
		const h = newHand(g, { seed: 'ev' + i, dealer: 0 });
		const rng = makeRng('ev' + i);
		while (!h.isOver()) {
			const seat = h.toAct()[0];
			const L = h.legal(seat);
			const r = must(h.apply(seat, L[rng.int(L.length)]));
			for (const e of r.events) {
				if (e.e !== 'pile_revealed' || r.events.some((x) => x.e === 'cards_kept')) continue;
				const v = h.view(1 - e.seat).open_piles.piles[e.seat][e.pile];
				assert.equal(v.top, e.card, 'the revealed card is the open top every seat sees');
			}
			for (const e of r.events) assert.ok(!('hand' in e) && !('hands' in e) && !('rest' in e), 'no hidden cards in an event: ' + e.e);
		}
	}
	const s = load('sedici_2');
	for (let i = 0; i < 30; i++) {
		const h = newHand(s, { seed: 'evs' + i, dealer: 0 });
		const rng = makeRng('evs' + i);
		while (!h.isOver()) {
			const seat = h.toAct()[0];
			const L = h.legal(seat);
			const r = must(h.apply(seat, L[rng.int(L.length)]));
			for (const e of r.events) {
				assert.ok(!('hand' in e) && !('hands' in e) && !('cards' in e && e.e !== 'trick_won'), 'no hidden cards in an event: ' + JSON.stringify(e));
				if (e.e === 'fuora_claimed') assert.deepEqual(Object.keys(e).sort(), ['e', 'points', 'seat', 'valid']);
			}
		}
	}
});
