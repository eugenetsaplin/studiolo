// Independent check of the core: the deal. Sizes for every seat count and dealer, the rest and the stock, the packets, the shuffle and the cut
// against an independent reference, presets.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DECK } from '../../core/index.js';
import { load, SIX, newH, presetOf, conserved, playOut, firstPick } from './lib.mjs';

// expected sizes after the deal (before any discard): [dealer, other], rest (out), stock
const EXPECT = {
	venticinque: { dealer: 28, other: 25, rest: 25, stock: 0 },
	morto: { dealer: 28, other: 25, rest: 0, stock: 25 },
	venticinque_3: { dealer: 28, other: 25, rest: 0, stock: 0 },
	partita_3: { dealer: 28, other: 25, rest: 0, stock: 0 },
	partita_4: { dealer: 21, other: 19, rest: 0, stock: 0 },
};
const MENO = { 2: 25, 3: 25, 4: 19, 5: 15, 6: 13, 7: 11 };

// advance through the a monte windows by passing (venticinque_3 deals in three packet rounds)
function passWindows(h) {
	while (h.s.phase === 'a_monte') {
		const seat = h.toAct()[0];
		assert.ok(h.apply(seat, { type: 'a_monte_pass' }).ok);
	}
}

test('deal sizes, rest and stock for every game, seat count and dealer', () => {
	for (const [id, n] of SIX) {
		const g = load(id, n);
		for (let d = 0; d < n; d++) {
			const h = newH(g, `deal-${id}-${n}-${d}`, d);
			passWindows(h);
			const sn = h.snapshot();
			const e = id === 'meno' ? { dealer: MENO[n], other: MENO[n], rest: 78 - n * MENO[n], stock: 0 } : EXPECT[id];
			for (let q = 0; q < n; q++) {
				assert.equal(sn.hands[q].length, q === d ? e.dealer : e.other, `${id}/${n} dealer ${d} seat ${q}`);
			}
			assert.equal(sn.rest.length, e.rest, `${id}/${n} rest`);
			assert.equal(sn.stock.length, e.stock, `${id}/${n} stock`);
			assert.ok(conserved(h));
		}
	}
});

test('after the discard every hand has the same size; meno has no discard', () => {
	for (const [id, n] of SIX) {
		const g = load(id, n);
		const h = newH(g, 'eq-' + id + n, n - 1);
		passWindows(h);
		if (id === 'meno') assert.equal(h.s.phase, 'tricks');
		while (h.s.phase === 'discard') { const s = h.toAct()[0]; h.apply(s, h.legal(s)[0]); }
		const sizes = h.s.hands.map((x) => x.length);
		assert.equal(new Set(sizes).size, 1, `${id}/${n}: ${sizes}`);
	}
});

test('venticinque_3: packet rounds 5, 10, 10 from the dealer\'s right, the dealer\'s three extra cards last', () => {
	const g = load('venticinque_3', 3);
	for (let d = 0; d < 3; d++) {
		const h = newH(g, 'pk' + d, d);
		const sizes = [];
		while (h.s.phase === 'a_monte') {
			// a window: the first to be asked is the dealer's right
			const sn = h.snapshot();
			sizes.push([0, 1, 2].map((q) => sn.hands[q].length));
			assert.deepEqual(h.toAct(), [(d + 1) % 3]);
			for (let i = 1; i <= 3; i++) {
				assert.deepEqual(h.toAct(), [(d + i) % 3]);
				h.apply(h.toAct()[0], { type: 'a_monte_pass' });
			}
		}
		const exp = (k, extra) => [0, 1, 2].map((q) => k + (q === d ? extra : 0));
		assert.deepEqual(sizes, [exp(5, 0), exp(15, 0), exp(25, 3)]);
		assert.equal(h.s.phase, 'discard');
	}
});

// an independent deal: Fisher-Yates from the end with j = int(i+1), the documented cut, then the cards in order
function sfc32(a, b, c, d) {
	return () => {
		a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
		const t = (((a + b) | 0) + d) | 0;
		d = (d + 1) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); c = (c + t) | 0;
		return (t >>> 0) / 4294967296;
	};
}
function cyrb128(str) {
	let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
	for (let i = 0, k; i < str.length; i++) {
		k = str.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}
	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213); h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
	h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
	return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}
export function refRng(seed) {
	const next = sfc32(...cyrb128(seed));
	return { next, int: (n) => Math.floor(next() * n) };
}

test('the shuffle and the cut match an independent sfc32/cyrb128 Fisher-Yates (venticinque, morto, meno 5)', () => {
	for (const [id, n] of [['venticinque', 2], ['morto', 2], ['meno', 5]]) {
		const g = load(id, n);
		for (let d = 0; d < n; d++) {
			const seed = `ref-${id}-${d}`;
			const r = refRng(seed);
			const a = DECK.slice();
			for (let i = a.length - 1; i > 0; i--) { const j = r.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
			const cut = 2 + r.int(78 - 4 + 1);
			const seq = a.slice(cut).concat(a.slice(0, cut));
			const h = newH(g, seed, d);
			const sn = h.snapshot();
			assert.equal(sn.cut, cut, 'cut');
			let at = 0;
			const want = {};
			for (let i = 1; i <= n; i++) {
				const q = (d + i) % n;
				const k = (id === 'meno' ? MENO[n] : 25) + (q === d && id !== 'meno' ? 3 : 0);
				want[q] = seq.slice(at, at + k).sort((x, y) => DECK.indexOf(x) - DECK.indexOf(y));
				at += k;
			}
			for (let q = 0; q < n; q++) assert.deepEqual(sn.hands[q], want[q], `${id} seat ${q}`);
			assert.deepEqual(id === 'morto' ? sn.stock : sn.rest, seq.slice(at));
		}
	}
});

test('a preset deals exactly the listed cards, keeps the rest in order; the morto stock is drawn from its start', () => {
	const g = load('morto', 2);
	const h0 = DECK.slice(0, 28), h1 = DECK.slice(28, 53), rest = DECK.slice(53);
	const h = newH(g, 'pre', 0, { preset: presetOf([h0, h1], rest) });
	const sn = h.snapshot();
	assert.deepEqual(sn.hands[0], h0);
	assert.deepEqual(sn.hands[1], h1);
	assert.deepEqual(sn.stock, rest);
	assert.equal(sn.cut, null);
	playOut(h, { pick: firstPick });
	assert.deepEqual(h.snapshot().tricks.map((t) => t.prize), rest);
});

// BUG: a preset that gives a seat fewer cards than the deal needs is silently filled from the rest
test('a preset with a seat short of cards is refused (not filled from the rest)', () => {
	const g = load('venticinque', 2);
	const h0 = DECK.slice(0, 27), h1 = DECK.slice(27, 52), rest = DECK.slice(52);
	assert.throws(() => newH(g, 'short', 0, { preset: presetOf([h0, h1], rest) }));
});

test('a preset with a card twice or a card missing is refused', () => {
	const g = load('venticinque', 2);
	const h0 = DECK.slice(0, 28), h1 = DECK.slice(28, 53), rest = DECK.slice(53);
	assert.throws(() => newH(g, 'dup', 0, { preset: presetOf([h0, [...h1.slice(1), h0[0]]], rest) }));
	assert.throws(() => newH(g, 'miss', 0, { preset: presetOf([h0, h1], rest.slice(1)) }));
});
