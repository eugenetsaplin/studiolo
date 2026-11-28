// Revision 14, the leaves of the Fool and of the discard of a player with no trick: the values stay, the marks and the other readings are written;
// the owner of the Fool is asked for the plain card in Chiamare il Re and Meno; Consiglio does not inherit the ban on signals.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, playRandom } from './helpers.js';

const GAMES = [['baronetti', 2], ['venticinque', 2], ['morto', 2], ['mitigati_2', 2], ['bagattultimo', 3], ['partita_3', 3], ['partita_4', 4], ['permesso_3', 3], ['permesso_5', 5], ['dottore', 4], ['chiamare_il_re', 4], ['meno', 3]];
const phase = (g, id) => g.rules.hand.phases.find((p) => p.id === id);

test('fool_no_tricks stays give_none in every game of the book of 1787, marked [R], with the other reading and the question', () => {
	for (const [id, seats] of GAMES) {
		const g = load(id, seats);
		assert.equal(g.cfg.cards.fool_no_tricks, 'give_none', id);
		const leaf = g.rules.cards.fool_no_tricks;
		assert.ok(leaf, `${id}: an explicit leaf`);
		assert.match(leaf.source, /^\[R\] /, id);
		assert.match(leaf.source, /p\. 21, rule 10/, id);
		assert.match(leaf.source, /Prammatica \[1846\], p\. 6/, id);
		assert.match(leaf.source, /Torino 1880, p\. 9/, id);
		assert.equal(leaf.alt, 'give_fool', id);
		assert.equal(leaf.replace.q, 2, id);
		assert.doesNotMatch(leaf.source, /is no ground|evenly/, id);
		// the words of p. 50 stand where a chain leads to that page
		const chained = ['baronetti', 'venticinque', 'morto', 'mitigati_2'].includes(id);
		assert.equal(/non sarò io obbligato a dartelo mai/.test(leaf.source), chained, id);
	}
	assert.equal(load('venticinque_3', 3).cfg.cards.fool_no_tricks, 'give_fool');
});

test('counts_for of the discard: explicit leaf in bagattultimo, morto and venticinque_3, the value is the old one', () => {
	for (const [id, seats] of [['bagattultimo', 3], ['morto', 2], ['venticinque_3', 3]]) {
		const leaf = phase(load(id, seats), 'discard').settings.counts_for;
		assert.ok(leaf, id);
		assert.equal(leaf.value, 'discarder', id);
		assert.equal(leaf.alt, 'discarder_unless_no_tricks', id);
		assert.equal(leaf.replace.q, 1, id);
		assert.match(leaf.source, /^\[R\] /, id);
	}
	assert.match(phase(load('venticinque_3', 3), 'discard').settings.counts_for.source, /lo scarto a chi scarta/);
	for (const [id, seats] of [['chiamare_il_re', 4], ['dottore', 4], ['partita_3', 3], ['partita_4', 4], ['permesso_3', 3]]) {
		const leaf = phase(load(id, seats), 'discard').settings.counts_for;
		assert.match(leaf.source, /^\[R\] /, id);
		assert.doesNotMatch(leaf.source, /p\. 55/, id);
		assert.doesNotMatch(leaf.source, /Dummett 1980, p\. 259 supports/, id);
	}
});

test('dealer_forfeit stays false in Venticinque and Morto, the other reading names Prammatica pp. 24-25', () => {
	for (const id of ['venticinque', 'morto']) {
		const leaf = phase(load(id, 2), 'count').settings.dealer_forfeit;
		assert.equal(leaf.value, false, id);
		assert.equal(leaf.alt, true, id);
		assert.match(leaf.source, /Prammatica \[1846\], pp\. 24-25/, id);
	}
});

test('Chiamare il Re and Meno ask the owner of the Fool for the plain card (question 18)', () => {
	for (const [id, seats] of [['chiamare_il_re', 4], ['meno', 2], ['meno', 5]]) {
		const g = load(id, seats);
		assert.equal(g.cfg.cards.fool_exchange_card, 'owner_choice', id);
		let asked = 0, answered = 0, ended = 0;
		for (let i = 0; i < 100; i++) {
			const h = playRandom(g, `r14nt:${id}:${seats}:${i}`, i % seats, (hh, seat, a) => {
				if (a.type === 'fool_give') answered++;
			}, {});
			if (h.s.foolGive) { asked++; assert.notEqual(h.s.foolGive.card, null, 'the card is given'); ended++; }
		}
		assert.ok(asked > 20, `${id}: the owner was asked in ${asked} of 100 hands`);
		assert.ok(answered > 0 && answered <= ended, id);
	}
	// Venticinque and Morto still give the cheapest card
	assert.equal(load('venticinque', 2).cfg.cards.fool_exchange_card, 'cheapest');
	assert.equal(load('morto', 2).cfg.cards.fool_exchange_card, 'cheapest');
});

test('Consiglio: the partners may talk and show their cards, signals are free; Partita keeps the ban', () => {
	assert.equal(load('consiglio', 4).cfg.sides.signals, 'free');
	assert.equal(load('partita_4', 4).cfg.sides.signals, 'forbidden');
	assert.match(load('consiglio', 4).rules.sides.signals.source, /si consultano liberamente/);
});
