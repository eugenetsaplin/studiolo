// Card values and the count, in twelfths of a book point (GAME_FILE_FORMAT 11.12).
// A group of g cards is worth the sum of its book values less (g - 1); in twelfths a card of a full group is
// worth 12v - 12(g-1)/g. Left-over cards follow odd_card: half_point, drop, as_group.
import { ALL } from './cards.js';
import { compileSelector } from './selectors.js';

const BASE = { 'rank:K': 5, 'rank:Q': 4, 'rank:N': 3, 'rank:J': 2 };

// {v: {card: book value}, named: {card: true}} or null when the tariff is not known.
export function valueTable(cardPoints) {
	let table;
	if (typeof cardPoints === 'string') {
		table = { ...BASE };
		if (cardPoints === 'honours_4_angel' || cardPoints === 'book_1787') Object.assign(table, { T20: 5, T1: 5, T0: 5 });
		else if (cardPoints === 'honours_4') Object.assign(table, { T21: 5, T1: 5, T0: 5 });
		else if (cardPoints === 'book_1787_short') Object.assign(table, { T20: 5, T1: 5, T0: 1 });
		else return null;
	} else if (cardPoints && typeof cardPoints === 'object' && !Array.isArray(cardPoints)) table = cardPoints;
	else return null;
	const v = {};
	const named = {};
	for (const c of ALL) v[c] = 1;
	const env = { sets: {}, values: null };
	for (const [sel, val] of Object.entries(table)) {
		if (typeof val !== 'number') return null;
		const p = compileSelector(sel, env);
		for (const c of ALL) if (p(c)) { v[c] = val; named[c] = true; }
	}
	return { v, named };
}

export function cardPointsSupported(cardPoints) {
	try { return valueTable(cardPoints) !== null; } catch { return false; }
}

// 12(g-1)/g: the twelfths a group takes off each of its cards
export function groupCut(g) {
	return (12 * (g - 1)) / g;
}

// book value of a card as counted: a plain card counted singly takes plainValue
function effective(table, id, g, plainValue) {
	return g === 1 && !table.named[id] && plainValue !== undefined ? plainValue : table.v[id];
}

export function cardTwelfths(table, id, g, plainValue) {
	return 12 * effective(table, id, g, plainValue) - groupCut(g);
}

// cards: ids in the order they were collected (the last ones are the odd ones, except with drop: the cheapest are dropped). Returns twelfths.
export function countTwelfths(cards, { table, group = 2, oddCard = 'half_point', plainValue = 1 }) {
	const g = group;
	if (oddCard === 'drop' && cards.length % g) {
		// the cards thrown away are the cheapest ones of the pile, whatever order they were collected in
		const k = cards.length % g;
		const idx = cards.map((c, i) => i).sort((a, b) => (table.v[cards[a]] - table.v[cards[b]]) || (a - b));
		const gone = new Set(idx.slice(0, k));
		cards = cards.filter((c, i) => !gone.has(i));
	}
	const full = cards.length - (cards.length % g);
	let total = 0;
	for (let i = 0; i < full; i++) total += cardTwelfths(table, cards[i], g, plainValue);
	const k = cards.length - full;
	if (k > 0 && oddCard !== 'drop') {
		if (oddCard === 'as_group') {
			let sum = 0;
			for (let i = full; i < cards.length; i++) sum += 12 * effective(table, cards[i], g, plainValue);
			total += sum - 12 * (k - 1);
		} else {
			for (let i = full; i < cards.length; i++) total += cardTwelfths(table, cards[i], g, plainValue);
		}
	}
	return total;
}
