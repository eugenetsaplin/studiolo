// The deck of the contract (section 3), written out on its own: the test library does not import the core.
export const SUITS = ['swords', 'batons', 'cups', 'coins'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'N', 'Q', 'K'];

// Canonical order: swords 1..K, batons, cups, coins, then T1 ... T21, then T0.
export function deck78() {
	const ids = [];
	for (const s of SUITS) for (const r of RANKS) ids.push(`${s}:${r}`);
	for (let i = 1; i <= 21; i++) ids.push(`T${i}`);
	ids.push('T0');
	return ids;
}

const ORDER = new Map(deck78().map((id, i) => [id, i]));
export const orderOf = id => ORDER.get(id) ?? Infinity;
export const sortCanonical = ids => [...ids].sort((a, b) => orderOf(a) - orderOf(b));

// A card id inside a longer string: never part of a longer word.
export const CARD_ID_RE = /(?<![A-Za-z0-9_])(?:T(?:1[0-9]|2[01]|[0-9])|(?:cups|coins|swords|batons):(?:10|[1-9]|J|N|Q|K))(?![A-Za-z0-9_])/g;
