// The 78-card deck: ids, the canonical order, and what every card is.
export const SUITS = ['swords', 'batons', 'cups', 'coins'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'N', 'Q', 'K'];
const RANK_NUM = { J: 11, N: 12, Q: 13, K: 14 };

export const ALL = [];
export const INDEX = Object.create(null);
export const INFO = Object.create(null);

function add(id, info) {
	info.id = id;
	info.i = ALL.length;
	INDEX[id] = ALL.length;
	INFO[id] = info;
	ALL.push(id);
}

for (const suit of SUITS) {
	for (const rank of RANKS) {
		const num = RANK_NUM[rank] || Number(rank);
		add(`${suit}:${rank}`, { suit, rank, num, trump: false, fool: false });
	}
}
for (let t = 1; t <= 21; t++) add(`T${t}`, { suit: 'trump', rank: String(t), num: t, trump: true, fool: false });
add('T0', { suit: 'trump', rank: '0', num: 0, trump: true, fool: true });

export const FOOL = 'T0';
export const DECK_SIZE = ALL.length;

export function isCard(id) {
	return typeof id === 'string' && id in INDEX;
}

export function sortCards(arr) {
	return arr.sort((a, b) => INDEX[a] - INDEX[b]);
}

export function compareCards(a, b) {
	return INDEX[a] - INDEX[b];
}
