// open_piles (a hook of tricks): the open piles of a pile game. Each seat owns piles dealt by deal.piles; only the top card of a
// pile is open and playable. After a trick (both cards played) each seat turns the next card of the pile it played from.
// A pile played to empty stays empty; the seat then plays from its other piles. With cards.fool_show_any_time an open
// Fool may be shown on the seat's turn: it is laid among the won cards, the next card of its pile turns at once, and the
// seat keeps its turn. Covered cards are never listed in a view, not even to their owner.
import { sortCards } from '../cards.js';

export const name = 'open_piles';
export const version = '1.0.0';
export const hook = 'tricks';

export const supports = {
	reveal: ['after_trick'],
	empty_pile: ['play_from_others'],
};

const FOOL = 'T0';

const piles = (h, seat) => (h.s.piles && h.s.piles[seat]) || [];
const openTop = (p) => (p.open && p.cards.length ? p.cards[p.cards.length - 1] : null);
const state = (h) => (h.s.m.open_piles || (h.s.m.open_piles = { from: {} }));

export function check(set, ctx) {
	const deal = ctx.phases.find((p) => p.module === 'deal');
	const has = deal && deal.settings && deal.settings.piles;
	return has ? [] : [{ key: 'reveal', value: set.reveal, why: 'open_piles needs deal.piles' }];
}

// the open cards the seat may choose from instead of its whole hand
export function playable(h, entry, seat) {
	const out = [];
	for (const p of piles(h, seat)) { const c = openTop(p); if (c !== null) out.push(c); }
	return sortCards(out);
}

export function visibleHand(h, entry, seat) {
	return playable(h, entry, seat);
}

// called when the card has left the seat's hand: it leaves its pile, which stays covered until the reveal
export function onPlay(h, entry, seat, card) {
	const list = piles(h, seat);
	const at = list.findIndex((p) => openTop(p) === card);
	if (at < 0) return [];
	const p = list[at];
	p.cards.pop();
	p.open = false;
	state(h).from[seat] = at;
	return [];
}

function turn(h, seat, at) {
	const p = piles(h, seat)[at];
	if (!p || p.cards.length === 0 || p.open) return [];
	p.open = true;
	return [{ e: 'pile_revealed', seat, pile: at, card: p.cards[p.cards.length - 1] }];
}

// the trick is over: every seat that played from a pile turns that pile's next card. A card left with no partner to
// answer it (the other seat showed the Fool) is taken by its owner at the end, uncontested.
export function afterTrick(h, entry, rec) {
	const s = h.s;
	const st = state(h);
	const events = [];
	for (const t of rec.cards) {
		if (st.from[t.seat] !== undefined) events.push(...turn(h, t.seat, st.from[t.seat]));
	}
	st.from = {};
	const lone = s.hands.map((l, seat) => (l.length ? seat : -1)).filter((x) => x >= 0);
	if (lone.length === 1 && s.hands.some((l) => l.length === 0)) {
		const seat = lone[0];
		const cards = s.hands[seat].slice();
		s.hands[seat] = [];
		for (const p of piles(h, seat)) { p.cards = []; p.open = false; }
		s.won[seat].push(...cards);
		events.push({ e: 'cards_kept', seat, cards });
	}
	return events;
}

function foolPile(h, seat) {
	return piles(h, seat).findIndex((p) => openTop(p) === FOOL);
}

export function extraLegal(h, entry, seat) {
	if (!h.game.cfg.cards.fool_show_any_time) return [];
	const m = h.s.m.tricks;
	if (!m || m.turn !== seat) return [];
	if (h.s.hands[seat].length < 2 || foolPile(h, seat) < 0) return [];
	// not once the other seat has no card left to answer with
	return [{ type: 'show_fool', card: FOOL }];
}

export function applyExtra(h, entry, seat, action) {
	const s = h.s;
	if (action.type !== 'show_fool') return { events: [] };
	const at = foolPile(h, seat);
	const p = piles(h, seat)[at];
	p.cards.pop();
	p.open = false;
	s.hands[seat].splice(s.hands[seat].indexOf(FOOL), 1);
	s.won[seat].push(FOOL);
	s.shown = s.shown || s.hands.map(() => []);
	s.shown[seat].push(FOOL);
	return { events: [{ e: 'fool_shown', seat }, ...turn(h, seat, at)] };
}

export function viewOf(h, entry) {
	const out = { piles: {}, shown: {} };
	for (let seat = 0; seat < h.s.n; seat++) {
		out.piles[seat] = piles(h, seat).map((p) => ({ size: p.cards.length, top: openTop(p) }));
		out.shown[seat] = ((h.s.shown && h.s.shown[seat]) || []).slice();
	}
	return out;
}
