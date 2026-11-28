// Independent check of the core: who discards, how many, and what is barred, for every file of the six that discards.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, loadWith, phaseOf, newH, deal, playOut, isTrump, allIds } from './lib.mjs';

const KINGS = ['swords:K', 'batons:K', 'cups:K', 'coins:K'];
const HONOURS = [...KINGS, 'T20', 'T1', 'T0'];
const legalCards = (h, seat) => h.legal(seat).map((a) => { assert.equal(a.type, 'discard'); return a.card; });
const minus = (a, b) => a.filter((c) => !b.includes(c));

// a dealer hand that holds the cards `want`, the rest of the deal filled in canonical order;
// noTrumpFill: the filler of the dealer holds no trump, so the trumps of the hand are exactly those wanted
function dealerWith(id, n, want, dealer = 0, noTrumpFill = false) {
	const g = typeof id === 'string' ? load(id, n) : id;
	const sizes = [];
	const big = g.plan.find((e) => e.module === 'deal').set;
	for (let q = 0; q < n; q++) sizes.push(big.hand_size + (q === dealer ? big.dealer_extra : 0));
	const wants = sizes.map((_, q) => (q === dealer ? want : []));
	const ban = [];
	if (noTrumpFill) ban[dealer] = isTrump;
	const h = newH(g, 'd', dealer, { preset: deal(sizes, wants, { ban }) });
	while (h.s.phase === 'a_monte') h.apply(h.toAct()[0], { type: 'a_monte_pass' });
	return h;
}

test('venticinque and morto: the dealer discards exactly three; the honours are barred, the World and the queens are not', () => {
	for (const id of ['venticinque', 'morto']) {
		const h = dealerWith(id, 2, [...HONOURS, 'T21', 'cups:Q'], 1);
		assert.equal(h.s.phase, 'discard');
		assert.deepEqual(h.toAct(), [1]);
		assert.deepEqual(h.legal(0), []);
		const ok = legalCards(h, 1);
		assert.deepEqual(ok.sort(), minus(h.s.hands[1], HONOURS).sort());
		assert.ok(ok.includes('T21') && ok.includes('cups:Q'));
		for (let i = 0; i < 3; i++) { assert.deepEqual(h.toAct(), [1]); assert.ok(h.apply(1, { type: 'discard', card: legalCards(h, 1)[0] }).ok); }
		assert.equal(h.s.phase, 'tricks');
		assert.equal(h.s.discard[1].length, 3);
		assert.equal(h.s.hands[1].length, 25);
	}
});

test('a barred card is refused and changes nothing', () => {
	const h = dealerWith('venticinque', 2, HONOURS, 0);
	const before = h.checksum();
	const r = h.apply(0, { type: 'discard', card: 'T1' });
	assert.equal(r.ok, false);
	assert.equal(h.checksum(), before);
	assert.equal(h.apply(1, { type: 'discard', card: h.s.hands[1][0] }).ok, false);
});

test('venticinque_3: four numbered trumps or more in the hand: no trump goes, not even XVI', () => {
	const h = dealerWith('venticinque_3', 3, [...HONOURS, 'T16', 'T17', 'T18', 'T19', 'T21'], 0);
	assert.equal(h.s.phase, 'discard');
	const ok = legalCards(h, 0);
	assert.ok(ok.length > 0);
	for (const c of ok) assert.ok(!isTrump(c), c);
	for (const c of KINGS) assert.ok(!ok.includes(c), c);
	// the border: four numbered trumps (the Fool is not counted) still bar all the trumps
	const four = legalCards(dealerWith('venticinque_3', 3, ['T0', 'T16', 'T17', 'T18', 'T19'], 0, true), 0);
	for (const c of four) assert.ok(!isTrump(c), c);
});

test('venticinque_3: three numbered trumps or fewer: any trump may go but the honours (the Bagatto, the Angel, the Fool, the kings)', () => {
	// three numbered trumps and the Fool: the Fool does not count
	let ok = legalCards(dealerWith('venticinque_3', 3, ['T0', 'T1', 'T16', 'T17', ...KINGS], 0, true), 0);
	assert.ok(ok.includes('T16') && ok.includes('T17'));
	for (const c of HONOURS) assert.ok(!ok.includes(c), c);
	// three numbered trumps without honours
	ok = legalCards(dealerWith('venticinque_3', 3, ['T5', 'T16', 'T19'], 0, true), 0);
	for (const c of ['T5', 'T16', 'T19']) assert.ok(ok.includes(c), c);
	// the Angel is a numbered trump: with T1, T20, T16, T17 there are four
	ok = legalCards(dealerWith('venticinque_3', 3, ['T1', 'T20', 'T16', 'T17'], 0, true), 0);
	for (const c of ok) assert.ok(!isTrump(c), c);
	// no trump at all
	ok = legalCards(dealerWith('venticinque_3', 3, [...KINGS], 0, true), 0);
	assert.ok(ok.length > 0);
	for (const c of KINGS) assert.ok(!ok.includes(c), c);
});

test('venticinque_3 alts: the old reading (XVII and up barred, XVI free) and no exception at all', () => {
	const old = load('venticinque_3', 3, { alts: ['hand.phases[discard].settings.barred'] });
	const ok = legalCards(dealerWith(old, 3, [...HONOURS, 'T16', 'T17', 'T18', 'T19', 'T21'], 0), 0);
	for (const c of [...HONOURS, 'T17', 'T18', 'T19', 'T21']) assert.ok(!ok.includes(c), c);
	assert.ok(ok.includes('T16'));
	// no exception: three trumps are barred as well
	const none = load('venticinque_3', 3, { alts: ['hand.phases[discard].settings.allowed_exceptions'] });
	for (const c of legalCards(dealerWith(none, 3, ['T5', 'T16', 'T19'], 0, true), 0)) assert.ok(!isTrump(c), c);
});

test('partita_3: the Bagatto may go only when it is the only trump of the hand and the Fool is absent; the other honours never', () => {
	// the Bagatto the only trump
	let h = dealerWith('partita_3', 3, ['T1', ...KINGS], 0, true);
	let ok = legalCards(h, 0);
	assert.ok(ok.includes('T1'));
	for (const c of KINGS) assert.ok(!ok.includes(c));
	// no Fool, but another trump (not an honour): the Bagatto stays; the other trump may go
	h = dealerWith('partita_3', 3, ['T1', 'T5'], 0, true);
	ok = legalCards(h, 0);
	assert.ok(!ok.includes('T1'));
	assert.ok(ok.includes('T5'));
	// the Angel with it
	h = dealerWith('partita_3', 3, ['T1', 'T20', ...KINGS], 0);
	ok = legalCards(h, 0);
	assert.ok(!ok.includes('T1'));
	for (const c of ['T20', ...KINGS]) assert.ok(!ok.includes(c));
	// the Fool in the hand
	h = dealerWith('partita_3', 3, ['T1', 'T0', 'T20'], 0);
	ok = legalCards(h, 0);
	assert.ok(!ok.includes('T1') && !ok.includes('T0') && !ok.includes('T20'));
	h = dealerWith('partita_3', 3, ['T1', 'T0'], 0, true);
	ok = legalCards(h, 0);
	assert.ok(!ok.includes('T1') && !ok.includes('T0'), 'the Fool and the Bagatto only: the Fool is in the hand');
	// the alt: no exception, the Bagatto alone stays too
	const none = load('partita_3', 3, { alts: ['hand.phases[discard].settings.allowed_exceptions'] });
	ok = legalCards(dealerWith(none, 3, ['T1', ...KINGS], 0, true), 0);
	assert.ok(!ok.includes('T1'));
});

test('the Bagatto exception is the same leaf in every game that has it, with the alt "no exception"', () => {
	const want = [{ if: { hand_lacks: 'T0', hand_count: { of: 'trumps', max: 1 } }, any: ['T1'] }];
	const games = [['partita_3', 3], ['partita_4', 4], ['consiglio', 4], ['dottore', 5], ['chiamare_il_re', 4], ['permesso_3', 3], ['permesso_7', 7]];
	for (const [id, n] of games) {
		assert.ok(allIds().includes(id), id);
		const leaf = phaseOf(load(id, n).rules, 'discard').settings.allowed_exceptions;
		assert.deepEqual(leaf.value, want, id);
		assert.deepEqual(leaf.alt, [], id);
	}
});

test('partita_4: the dealer discards two; the kings and the Bagatto are barred (the Bagatto free when it is the only trump)', () => {
	let h = dealerWith('partita_4', 4, ['T1', 'T0', 'T20', ...KINGS], 2);
	assert.deepEqual(h.toAct(), [2]);
	assert.equal(h.s.hands[2].length, 21);
	let ok = legalCards(h, 2);
	for (const c of ['T1', 'T0', 'T20', ...KINGS]) assert.ok(!ok.includes(c), c);
	h.apply(2, { type: 'discard', card: ok[0] });
	h.apply(2, { type: 'discard', card: legalCards(h, 2)[0] });
	assert.equal(h.s.phase, 'tricks');
	h = dealerWith('partita_4', 4, ['T1', ...KINGS], 0, true);
	ok = legalCards(h, 0);
	assert.ok(ok.includes('T1'));
	for (const c of KINGS) assert.ok(!ok.includes(c));
});

test('partita_4 with discard_honours_barred false (its alt): the Angel and the Fool may go, the kings and the Bagatto still not', () => {
	const g = load('partita_4', 4, { alts: ['hand.phases[discard].settings.discard_honours_barred'] });
	const h = dealerWith(g, 4, ['T1', 'T0', 'T20', ...KINGS], 0);
	const ok = legalCards(h, 0);
	assert.ok(ok.includes('T20') && ok.includes('T0'));
	assert.ok(!ok.includes('T1'));
	for (const c of KINGS) assert.ok(!ok.includes(c));
});

test('engine default: when every card left in the hand is barred, all of them may go', () => {
	const g = loadWith('venticinque', 2, (f) => {
		phaseOf(f, 'discard').settings.barred = { value: ['all'], source: '[S] test' };
	});
	assert.ok(g.support.runnable, JSON.stringify(g.support.missing));
	const h = newH(g, 'allbarred', 0);
	assert.equal(legalCards(h, 0).length, 28);
});

// the model of the rules, written out here and not read from the files: what a dealer must not put away,
// judged on the hand as dealt (revision 2)
function barredOf(id, dealt) {
	const trumps = dealt.filter(isTrump);
	if (id === 'venticinque_3') {
		const numbered = trumps.filter((c) => c !== 'T0').length;
		return numbered >= 4 ? [...HONOURS, ...trumps] : HONOURS; // three or fewer: any trump but the honours may go
	}
	if (id === 'partita_4') {
		const bagattoFree = !dealt.includes('T0') && trumps.length === 1 && trumps[0] === 'T1'; // the only trump, no Fool
		return bagattoFree ? HONOURS.filter((c) => c !== 'T1') : HONOURS;
	}
	return HONOURS;
}

test('the discard of a random hand never holds a barred card unless the whole hand was barred', () => {
	let few = 0, many = 0;
	for (const [id, n] of [['venticinque', 2], ['morto', 2], ['venticinque_3', 3], ['partita_4', 4]]) {
		const g = load(id, n);
		for (let i = 0; i < 60; i++) {
			const h = newH(g, `rd-${id}-${i}`, i % n);
			const dealt = h.snapshot().hands[i % n].slice();
			playOut(h, { seed: id + i, pick: (hh, seat, legal, rng) => (legal[0].type === 'a_monte_propose' ? legal[1] : legal[rng.int(legal.length)]) });
			const bar = barredOf(id, dealt);
			for (const c of h.snapshot().discard[i % n]) assert.ok(!bar.includes(c), `${id}: ${c} put away`);
			if (id === 'venticinque_3') { if (dealt.filter((c) => isTrump(c) && c !== 'T0').length <= 3) few++; else many++; }
		}
	}
	assert.ok(few > 0 && many > 0, `both cases of venticinque_3 occur in the sample (${few} / ${many})`);
});

// As REVISIONS.md records (revision 2): the exception of the Bagatto is judged on the hand AS DEALT, not at each discard
// step: otherwise a dealer could put another trump away first and so «free» the Bagatto. The core
// (discard 1.1.0) counts the cards already put away in this phase as held.
test('partita_4 alt: discarding the Fool first does not free the Bagatto', () => {
	const g = load('partita_4', 4, { alts: ['hand.phases[discard].settings.discard_honours_barred'] });
	const h = newH(g, 'q', 0, { preset: deal([21, 19, 19, 19], [['T0', 'T1']]) });
	assert.ok(!h.legal(0).some((a) => a.card === 'T1'));
	h.apply(0, { type: 'discard', card: 'T0' });
	assert.ok(!h.legal(0).some((a) => a.card === 'T1'));
});

test('partita_3: putting the other trump away does not free the Bagatto (the hand as dealt)', () => {
	// the dealer holds the Bagatto and one more trump that is no honour, no Fool: the Bagatto is not alone as dealt
	const h = dealerWith('partita_3', 3, ['T1', 'T5'], 0, true);
	assert.ok(!legalCards(h, 0).includes('T1'));
	assert.ok(h.apply(0, { type: 'discard', card: 'T5' }).ok);
	assert.ok(!legalCards(h, 0).includes('T1'), 'after T5 went, the Bagatto must still be barred');
});
