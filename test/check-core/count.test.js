// Independent check of the core: the Fool's exchange, the count, the result and the payments of random hands, recomputed independently from
// the snapshot; the morto stock; dealer_forfeit; the stake option; the group option.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DECK } from '../../core/index.js';
import { load, loadWith, phaseOf, SIX, newH, deal, playOut } from './lib.mjs';

const VAL = (c) => {
	if (['T20', 'T1', 'T0'].includes(c)) return 5;
	const r = c.includes(':') ? c.split(':')[1] : '';
	return { K: 5, Q: 4, N: 3, J: 2 }[r] || 1;
};
const IDX = (c) => DECK.indexOf(c);

// twelfths of a heap: half_point (each card 12v - 12(g-1)/g) or as_group for the left-over cards
function refCount(cards, g, odd) {
	const k = cards.length % g;
	const full = cards.length - k;
	let t = 0;
	cards.forEach((c, i) => { if (i < full || odd === 'half_point') t += 12 * VAL(c) - (12 * (g - 1)) / g; });
	if (k && odd === 'as_group') t += cards.slice(full).reduce((a, c) => a + 12 * VAL(c), 0) - 12 * (k - 1);
	return t;
}

const SPEC = {
	venticinque: { g: 2, odd: 'half_point', win: 'more', gp: 1, settle: null, give: 'cheapest', to: 'opp' },
	morto: { g: 2, odd: 'half_point', win: 'more', gp: 1, settle: null, give: 'cheapest', to: 'opp' },
	venticinque_3: { g: 3, odd: 'as_group', win: 'threshold', gp: 0, settle: null, give: 'choice', to: 'winner', giveFool: true },
	partita_3: { g: 2, odd: 'half_point', win: 'more', gp: 0, settle: 'losers', give: 'choice', to: 'winner' },
	partita_4: { g: 2, odd: 'half_point', win: 'more', gp: 0, settle: 'pair', give: 'choice', to: 'winner', pairs: true },
	meno: { g: 2, odd: 'half_point', win: 'fewest', gp: 0, settle: 'worst', share: true, give: 'cheapest', to: 'winner' },
};

function units(n, pairs) {
	if (!pairs) return Array.from({ length: n }, (_, i) => [i]);
	return [[0, 2], [1, 3]];
}

function checkHand(id, n, h, sp, stake = 1, g = sp.g) {
	const sn = h.snapshot();
	const res = h.result();
	const dealer = sn.dealer;
	// the Fool's exchange
	const foolTrick = sn.tricks.find((t) => t.fool !== null);
	const fg = sn.foolGive;
	if (foolTrick) {
		const owner = foolTrick.fool;
		const side = sp.pairs ? [owner, (owner + 2) % 4] : [owner];
		const to = sp.to === 'opp' ? 1 - owner : sp.to === 'winner' ? foolTrick.winner : (owner + 1) % n;
		const before = side.flatMap((q) => sn.won[q]).filter((c) => c !== 'T0');
		if (fg && fg.card && fg.card !== 'T0') before.push(fg.card);
		if (!before.length) {
			if (sp.giveFool) { assert.equal(fg && fg.card, 'T0', `${id}: a side without tricks gives the Fool`); assert.equal(fg.to, to); }
			else assert.ok(!fg || !fg.card, `${id}: an owner without won cards gives nothing`);
		} else {
			assert.ok(fg && fg.card, `${id}: the Fool's card was not given`);
			assert.equal(fg.from, owner);
			assert.equal(fg.to, to, `${id}: the Fool's card goes to the wrong seat`);
			assert.ok(sn.won[to].includes(fg.card));
			if (sp.give === 'cheapest') {
				const best = before.slice().sort((a, b) => VAL(a) - VAL(b) || IDX(a) - IDX(b))[0];
				assert.equal(fg.card, best, `${id}: not the cheapest card`);
			} else {
				const plain = before.filter((c) => VAL(c) <= 1);
				if (plain.length) assert.equal(VAL(fg.card), 1, `${id}: the owner gave a counting card while holding plain ones`);
			}
		}
	} else assert.ok(!fg || !fg.card);
	// the count
	const us = units(n, sp.pairs);
	const pts = us.map((u) => {
		const cards = u.flatMap((q) => sn.won[q]);
		if (u.includes(dealer)) cards.push(...sn.discard[dealer]);
		return refCount(cards, g, sp.odd);
	});
	us.forEach((u, i) => u.forEach((q) => assert.equal(res.points[q], pts[i], `${id}/${n}: points of seat ${q}`)));
	if (id === 'morto') assert.equal(pts[0] + pts[1], 1092, 'morto counts all 78 cards: 91 points');
	// the result
	let winners;
	if (sp.win === 'threshold') winners = us.filter((_, i) => pts[i] >= 26 * 12);
	else {
		const best = sp.win === 'fewest' ? Math.min(...pts) : Math.max(...pts);
		const at = us.filter((_, i) => pts[i] === best);
		// revision 10, Meno: the players level on the fewest points all win; all level is a tie, nobody wins
		winners = sp.share ? (at.length < us.length ? at : []) : at.length === 1 ? at : [];
	}
	const ws = winners.flat().sort((a, b) => a - b);
	assert.deepEqual(res.winners, ws, `${id}/${n}: winners`);
	for (let q = 0; q < n; q++) assert.equal(res.gamePoints[q], ws.includes(q) ? sp.gp : 0);
	// the payments
	let pays = [];
	if (sp.settle === 'losers' && ws.length) pays = Array.from({ length: n }, (_, q) => q).filter((q) => !ws.includes(q)).map((q) => ({ from: q, to: ws[0] }));
	// revision 10, Meno: the one with the most points pays each winner (the players level on the most all pay)
	if (sp.settle === 'worst' && ws.length) { const top = Math.max(...pts); pays = Array.from({ length: n }, (_, q) => q).filter((q) => pts[q] === top).flatMap((q) => ws.map((w) => ({ from: q, to: w }))); }
	if (sp.settle === 'pair' && ws.length) pays = ws.map((w) => ({ from: (w + 1) % 4, to: w }));
	const got = res.payments.map((p) => ({ from: p.from, to: p.to })).sort((a, b) => a.from - b.from || a.to - b.to);
	assert.deepEqual(got, pays.sort((a, b) => a.from - b.from || a.to - b.to), `${id}/${n}: payments`);
	for (const p of res.payments) assert.equal(p.amount, stake);
	return res;
}

const pickRandom = (hh, seat, legal, rng) => (legal[0].type === 'a_monte_propose' ? legal[1] : legal[rng.int(legal.length)]);

test('random hands: the Fool\'s exchange, the points, the winners and the payments agree with the reference', () => {
	for (const [id, n] of SIX) {
		const g = load(id, n);
		let ties = 0;
		for (let i = 0; i < 150; i++) {
			const h = newH(g, `ct-${id}-${n}-${i}`, i % n);
			playOut(h, { seed: `c${id}${n}${i}`, pick: pickRandom });
			const r = checkHand(id, n, h, SPEC[id]);
			if (!r.winners.length) ties++;
		}
		assert.ok(ties < 150, id + ': never a winner');
	}
});

test('the stake option sets the payment (partita_3 stake 5, meno 6 seats stake 10)', () => {
	for (const [id, n, stake] of [['partita_3', 3, 5], ['meno', 6, 10], ['partita_4', 4, 2]]) {
		const g = load(id, n, { options: { stake } });
		for (let i = 0; i < 20; i++) {
			const h = newH(g, `st-${id}-${i}`, i % n);
			playOut(h, { seed: 's' + i, pick: pickRandom });
			checkHand(id, n, h, SPEC[id], stake);
		}
	}
});

test('partita_4 with the group option 4: counted by fours, the left-over cards as an incomplete group (864 twelfths for the deck)', () => {
	const g = load('partita_4', 4, { options: { group: 4 } });
	for (let i = 0; i < 40; i++) {
		const h = newH(g, 'g4-' + i, i % 4);
		playOut(h, { seed: 'g' + i, pick: pickRandom });
		// revision 9, answer 6: at group 4 the cards left over are counted as an incomplete group (odd_card as_group), the deck is 72
		checkHand('partita_4', 4, h, { ...SPEC.partita_4, odd: 'as_group' }, 1, 4);
	}
});

test('morto: one stock card per trick to the trick winner, in stock order, the Fool\'s trick to its winner', () => {
	const g = load('morto', 2);
	for (let i = 0; i < 40; i++) {
		const h = newH(g, 'mo' + i, i % 2);
		const stock0 = h.snapshot().stock.slice();
		playOut(h, { seed: 'mo' + i, pick: pickRandom });
		const sn = h.snapshot();
		assert.equal(sn.tricks.length, 25);
		sn.tricks.forEach((t, k) => {
			assert.equal(t.prize, stock0[k]);
			assert.ok(sn.drawn.some((d) => d.trick === k && d.seat === t.winner && d.card === stock0[k]));
		});
		assert.equal(sn.stock.length, 0);
	}
});

// dealer_forfeit true: a dealer who wins no trick gives his discard to the winner of the last trick
test('dealer_forfeit true sends the discard of a dealer without tricks to the last trick winner; false keeps it', () => {
	const strong = [...Array.from({ length: 21 }, (_, i) => 'T' + (i + 1)), 'swords:K', 'batons:K', 'cups:K', 'coins:K'];
	const p = deal([28, 25], [[], strong]);
	const play = (forfeit) => {
		const g = loadWith('venticinque', 2, (f) => {
			phaseOf(f, 'count').settings.dealer_forfeit = { value: forfeit, source: '[S] test' };
		});
		const h = newH(g, 'df', 0, { preset: p });
		playOut(h, { pick: (hh, seat, legal) => legal[0] });
		return h;
	};
	const yes = play(true);
	assert.equal(yes.snapshot().won[0].length, 0, 'the dealer won no card');
	const disc = yes.snapshot().discard[0];
	const v = disc.reduce((a, c) => a + 12 * VAL(c) - 6, 0);
	assert.equal(yes.result().points[0], 0);
	const no = play(false);
	assert.equal(no.result().points[0], v);
	assert.equal(no.result().points[1] + v, yes.result().points[1]);
});

test('venticinque_3 give_fool: an owner who won nothing gives the Fool itself to the winner of the Fool\'s trick', () => {
	const low = ['T0', ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].flatMap((r) => [`swords:${r}`, `batons:${r}`]), 'cups:10', 'cups:9', 'cups:8', 'cups:7'];
	const p = deal([28, 25, 25], [[], [], low]);
	const g = load('venticinque_3', 3);
	const h = newH(g, 'gf', 0, { preset: p });
	playOut(h, { seed: 'gf', pick: (hh, seat, legal, rng) => (legal[0].type === 'a_monte_propose' ? legal[1] : legal[rng.int(legal.length)]) });
	const sn = h.snapshot();
	const ft = sn.tricks.find((t) => t.fool !== null);
	assert.equal(ft.fool, 2);
	assert.ok(sn.tricks.every((t) => t.winner !== 2));
	assert.deepEqual({ from: sn.foolGive.from, to: sn.foolGive.to, card: sn.foolGive.card }, { from: 2, to: ft.winner, card: 'T0' });
	assert.ok(sn.won[ft.winner].includes('T0'));
	assert.deepEqual(sn.won[2], []);
	assert.equal(h.result().points[2], 0);
});
