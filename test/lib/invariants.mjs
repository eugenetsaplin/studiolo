// Invariants of a hand and an independent recount of the points. Written from the book values (GAME_FILE_FORMAT 5.5 and GAME_FILE_FORMAT 11.12)
// and contract sections 4 and 8; it does not import the core.
import { deck78, sortCanonical } from './deck.mjs';

// Every card of the deck exactly once among hands, discard, rest, stock, won and the open trick.
export function conservation(snapshot, deck = deck78()) {
	const where = new Map();
	const put = (id, place) => { if (!where.has(id)) where.set(id, []); where.get(id).push(place); };
	const lists = (obj, name) => { for (const [s, cards] of Object.entries(obj || {})) (cards || []).forEach(c => put(c, `${name}[${s}]`)); };
	lists(snapshot.hands, 'hands');
	lists(snapshot.discard, 'discard');
	lists(snapshot.won, 'won');
	(snapshot.rest || []).forEach(c => put(c, 'rest'));
	(snapshot.stock || []).forEach(c => put(c, 'stock'));
	(snapshot.trick || []).forEach(t => put(typeof t === 'string' ? t : t.card, 'trick'));
	const problems = [];
	const inDeck = new Set(deck);
	for (const id of deck) {
		const w = where.get(id) || [];
		if (w.length === 0) problems.push(`${id}: missing`);
		else if (w.length > 1) problems.push(`${id}: ${w.length} times (${w.join(', ')})`);
	}
	for (const id of sortCanonical([...where.keys()])) if (!inDeck.has(id)) problems.push(`${id}: not a card of the deck`);
	return problems;
}

// ---- points, in twelfths ----
const COURT = { K: 5, Q: 4, N: 3, J: 2 };

// Book values of a card (not less one). Presets of format 5.5; a table maps «rank:K», «T1», «trumps», «suit:cups», a card id to a value.
function bookValue(id, cardPoints, plain) {
	if (typeof cardPoints === 'string') {
		const angelT = cardPoints === 'honours_4_angel' || cardPoints === 'book_1787' ? 'T20'
			: cardPoints === 'honours_4' ? 'T21' : cardPoints === 'book_1787_short' ? 'T20' : null;
		if (!angelT) throw new Error('unknown preset ' + cardPoints);
		if (id === 'T0') return cardPoints === 'book_1787_short' ? 1 : 5;
		if (id === 'T1' || id === angelT) return 5;
		if (id.includes(':')) { const r = id.split(':')[1]; if (r in COURT) return COURT[r]; }
		return plain;
	}
	const t = cardPoints;
	if (id in t) return t[id];
	if (id.includes(':')) {
		const [suit, rank] = id.split(':');
		if (`rank:${rank}` in t) return t[`rank:${rank}`];
		if (`suit:${suit}` in t) return t[`suit:${suit}`];
	} else if (id !== 'T0' && 'trumps' in t) return t.trumps;
	return plain;
}

const plainOf = (cardPoints, group, plainValue) =>
	(typeof cardPoints === 'string' && cardPoints === 'book_1787_short') || group === 1 ? plainValue : 1;

// cardsBySeat: {seat: [ids]} in the order the seat won them (the last cards are the odd ones).
// opts: {cardPoints (preset or table), group (1..4, default 2), oddCard ('half_point' | 'drop' | 'as_group', default 'half_point'), plainValue (default 1)}
// A group of g cards = the sum of the book values less (g-1); in twelfths: 12v - 12(g-1)/g per card in a full group.
export function recount(cardsBySeat, { cardPoints, group = 2, oddCard = 'half_point', plainValue = 1 }) {
	const out = {};
	const plain = plainOf(cardPoints, group, plainValue);
	for (const [seat, cards] of Object.entries(cardsBySeat)) {
		const v = cards.map(c => 12 * bookValue(c, cardPoints, plain));
		const full = Math.floor(v.length / group) * group;
		const sum = a => a.reduce((x, y) => x + y, 0);
		let total = sum(v.slice(0, full)) - 12 * (group - 1) * (full / group);
		const odd = v.slice(full);
		if (odd.length) {
			if (oddCard === 'half_point') total += sum(odd) - (odd.length * 12 * (group - 1)) / group;
			else if (oddCard === 'as_group') total += sum(odd) - (group === 3 && odd.length === 1 ? 12 : 12 * (odd.length - 1)); // by threes a lone card loses one point (Torino 1880, p. 8)
			else if (oddCard !== 'drop') throw new Error('unknown odd_card ' + oddCard);
		}
		out[seat] = total;
	}
	return out;
}
