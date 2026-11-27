// deal: shuffle, cut and give the hands, in packet rounds, or in piles. With dead "stock" the undealt cards
// stay in s.rest in order, and a later round of a repeat group deals from them with no shuffle and no cut. The cut and the packets are automatic (a fair shuffle makes
// every choice of them equal in chance); the snapshot records them. The dealer's extra cards come with his last packet
// (extra_when last or any) or his first (first). The undealt cards are the rest (out of play) or the prize stock.
import { ALL, DECK_SIZE, sortCards, isCard } from '../cards.js';
import { makeRng, shuffle } from '../rng.js';
import { isObj, roleValue, seatAt } from '../util.js';

export const name = 'deal';
export const version = '1.0.0';

const okInt = (v) => Number.isInteger(v) && v >= 0;
export const supports = {
	hand_size: (v) => {
		if (okInt(v)) return true;
		if (isObj(v) && isObj(v.by_role) && Object.values(v.by_role).every(okInt)) return true;
		if (v === 'half_rest') return true;
		return 'all_rest and unresolved by_seats are not played';
	},
	dealer_extra: (v) => okInt(v) || 'must be a whole number',
	extra_to: ['dealer'],
	extra_when: ['first', 'last', 'any'],
	packets: (v) => (v === 'dealer_choice' || v === 'one_by_one' || (Array.isArray(v) && v.length > 0 && v.every((x) => Number.isInteger(x) && x > 0))) || 'bad packets',
	packets_announced: '*',
	order: ['from_right', 'from_left', 'opponent_first'],
	pile_count: [0],
	pile_size: '*',
	pile_top: ['up', 'down'],
	piles: (v) => (Array.isArray(v) && v.length > 0 && v.every((x) => Number.isInteger(x) && x > 0)) || 'a list of pile sizes',
	dead: ['out', 'prize', 'none', 'stock'],
	from: ['deck', 'rest'],
	face: ['down'],
};

// cross checks of one phase: the deal must fit the deck and the packets the hand size
export function check(set, ctx) {
	const bad = [];
	const n = ctx.seats;
	const extra = set.dealer_extra || 0;
	const hs = set.hand_size;
	if (Array.isArray(set.piles)) {
		if (hs !== undefined) return [{ key: 'hand_size', value: hs, why: 'hand_size is not played together with piles' }];
		const per = set.piles.reduce((a, b) => a + b, 0);
		const sum = n * per + extra;
		if (sum > DECK_SIZE) bad.push({ key: 'piles', value: set.piles, why: `the piles (${sum} cards) do not fit the deck of ${DECK_SIZE}` });
		else if (set.dead === 'none' && sum !== DECK_SIZE) bad.push({ key: 'dead', value: 'none', why: `dead none, but ${DECK_SIZE - sum} cards would be left` });
		if (set.pile_count || set.pile_size) bad.push({ key: 'piles', value: set.piles, why: 'piles and pile_count are two ways to say the same: use one' });
		return bad;
	}
	if (hs === undefined) return [{ key: 'hand_size', value: null, why: 'hand_size is required' }];
	if (hs === 'half_rest') {
		if (set.from !== 'rest') bad.push({ key: 'hand_size', value: hs, why: 'half_rest deals the cards left by an earlier deal: it needs from: rest' });
		if (Array.isArray(set.packets)) bad.push({ key: 'packets', value: set.packets, why: 'half_rest is dealt in one round: no packets list' });
		return bad;
	}
	if (set.from === 'rest') bad.push({ key: 'from', value: 'rest', why: 'from: rest is played only with hand_size half_rest' });
	let total = 0;
	const sizes = [];
	for (let s = 0; s < n; s++) {
		const v = roleValue(hs, s, 0);
		if (!okInt(v)) return bad;
		sizes.push(v);
		total += v + (s === 0 ? extra : 0);
	}
	if (total > DECK_SIZE) bad.push({ key: 'hand_size', value: hs, why: `the hands (${total} cards) do not fit the deck of ${DECK_SIZE}` });
	else if (set.dead === 'none' && total !== DECK_SIZE) bad.push({ key: 'dead', value: 'none', why: `dead none, but ${DECK_SIZE - total} cards would be left` });
	if (Array.isArray(set.packets)) {
		const sum = set.packets.reduce((a, b) => a + b, 0);
		if (sizes.some((x) => x !== sum)) bad.push({ key: 'packets', value: set.packets, why: 'the packets do not add up to the hand size' });
	}
	return bad;
}

// the deal phase the engine is in; a module called from another phase (a_monte) deals by the game's first deal phase
export function dealEntry(h) {
	return h.cur && h.cur.module === 'deal' ? h.cur : h.entry('deal');
}

// the cards the deal gives to every seat when hand_size is half_rest: what is left, less the dealer's extra, shared
export function halfRestSize(h, set) {
	const left = h.s.rest.length - (set.dealer_extra || 0);
	return Math.floor(left / h.playing().length);
}

const fromRest = (st) => st.from === 'rest';

export function dealingOrder(h) {
	const { n, dealer } = h.s;
	const out = [];
	const step = dealEntry(h).set.order === 'from_left' ? -1 : 1;
	// a seat that has gone out (the others play on) is not dealt to
	for (let i = 1; i <= n; i++) out.push(seatAt(dealer, i * step, n));
	const quit = h.outSeats();
	return quit.length ? out.filter((q) => !quit.includes(q)) : out;
}

// per round, per seat: the number of cards
function planRounds(h) {
	const st = dealEntry(h).set;
	const { n, dealer } = h.s;
	if (Array.isArray(st.piles)) return { rounds: [], packets: [] };
	const extra = st.dealer_extra || 0;
	const base = [];
	const quit = h.outSeats();
	for (let s = 0; s < n; s++) base.push(quit.includes(s) ? 0 : st.hand_size === 'half_rest' ? halfRestSize(h, st) : roleValue(st.hand_size, s, dealer));
	// the seat that is dealt first speaks for the size of a packet
	const first = h.firstPlaying((dealer + 1) % n);
	const packets = Array.isArray(st.packets) ? st.packets : [base[first]];
	const rounds = packets.map((p, r) => {
		const row = base.map((b, s) => (quit.includes(s) ? 0 : Array.isArray(st.packets) ? p : b));
		const at = st.extra_when === 'first' ? 0 : packets.length - 1;
		if (r === at) row[dealer] += extra;
		return row;
	});
	// the packets recorded are the rounds as dealt: the cards of the seat on the dealer's right in each round
	return { rounds, packets: Array.isArray(st.packets) ? [...st.packets] : rounds.map((r) => r[first]) };
}

// preset.piles = {<seat>: [[bottom..top], ...]}: the piles exactly as they lie; the sequence is the order they are dealt in
function presetPilesSequence(h, preset) {
	const { n } = h.s;
	const sizes = dealEntry(h).set.piles;
	const order = dealingOrder(h);
	if (preset.hands && Object.values(preset.hands).some((l) => l && l.length)) throw new Error('preset: this deal has piles, give preset.piles');
	const seq = [];
	sizes.forEach((size, p) => {
		for (const seat of order) {
			const pile = preset.piles && preset.piles[String(seat)] && preset.piles[String(seat)][p];
			if (!Array.isArray(pile) || pile.length !== size) throw new Error('preset: pile ' + p + ' of seat ' + seat + ' must hold ' + size + ' cards');
			seq.push(...pile);
		}
	});
	for (let seat = 0; seat < n; seat++) {
		if (preset.piles && preset.piles[String(seat)] && preset.piles[String(seat)].length !== sizes.length) throw new Error('preset: seat ' + seat + ' has the wrong number of piles');
	}
	seq.push(...(preset.rest || []));
	const seen = new Set(seq);
	if (seq.length !== DECK_SIZE || seen.size !== DECK_SIZE || !seq.every(isCard)) throw new Error('preset: not the whole deck, each card once');
	return seq;
}

function presetSequence(h, preset, rounds) {
	const { n } = h.s;
	const order = dealingOrder(h);
	const lists = [];
	for (let s = 0; s < n; s++) lists.push([...((preset.hands && preset.hands[String(s)]) || [])]);
	const seq = [];
	for (const row of rounds) for (const s of order) {
		if (lists[s].length < row[s]) throw new Error('preset: seat ' + s + ' has fewer cards than the deal gives');
		seq.push(...lists[s].splice(0, row[s]));
	}
	if (lists.some((l) => l.length)) throw new Error('preset: a seat has more cards than the deal gives');
	seq.push(...(preset.rest || []));
	const seen = new Set(seq);
	if (seq.length !== DECK_SIZE || seen.size !== DECK_SIZE || !seq.every(isCard)) throw new Error('preset: not the whole deck, each card once');
	return seq;
}

// Shuffles (or takes the preset), cuts, and resets the places of the cards. Nothing is dealt yet.
export function start(h, seed, preset) {
	const s = h.s;
	const ent = dealEntry(h);
	const st = ent.set;
	const { rounds, packets } = planRounds(h);
	const piles = Array.isArray(st.piles);
	if (fromRest(st)) {
		// a second deal: the cards left by the earlier deal, in their order, on top of the hands the seats keep
		s.packets = packets;
		s.m[ent.id] = { rounds, round: 0, order: dealingOrder(h), dead: st.dead || 'out' };
		return;
	}
	if (laterRound(h)) {
		// a later round of a repeat group: the undealt cards in their order, no shuffle, no cut
		s.packets = packets;
		s.hands = Array.from({ length: s.n }, () => []);
		s.m[ent.id] = { rounds, round: 0, order: dealingOrder(h), dead: st.dead || 'out' };
		return;
	}
	let seq;
	let cut = null;
	if (preset) seq = piles ? presetPilesSequence(h, preset) : presetSequence(h, preset, rounds);
	else {
		const rng = makeRng(seed);
		seq = shuffle(ALL.slice(), rng);
		const min = h.game.cfg.seats.cut_min || 2;
		if ((h.game.cfg.seats.cut_by || 'left') !== 'none' && DECK_SIZE - 2 * min >= 0) {
			cut = min + rng.int(DECK_SIZE - 2 * min + 1);
			seq = seq.slice(cut).concat(seq.slice(0, cut));
		}
	}
	s.cut = cut;
	s.packets = packets;
	s.rest = seq;
	s.stock = [];
	s.hands = Array.from({ length: s.n }, () => []);
	if (piles) { s.piles = Array.from({ length: s.n }, () => []); s.shown = Array.from({ length: s.n }, () => []); }
	s.m[ent.id] = { rounds, round: 0, order: dealingOrder(h), dead: st.dead || 'out' };
}

// a round after the first of a repeat group that keeps the stock: it deals from s.rest as it lies
function laterRound(h) {
	return (h.s.round || 0) > 0 && (dealEntry(h).set.dead === 'stock');
}

// how many cards one round of this deal takes from the pack (the engine and the deal ask it for the empty stock)
export function cardsNeeded(h) {
	const st = dealEntry(h).set;
	if (Array.isArray(st.piles)) return h.playing().length * st.piles.reduce((a, b) => a + b, 0) + (st.dealer_extra || 0);
	return planRounds(h).rounds.reduce((a, row) => a + row.reduce((x, y) => x + y, 0), 0);
}

// every pile of the table, one pile of each seat at a time, the opponent first: each pile is [bottom..top], the top open
function dealPiles(h) {
	const s = h.s;
	const st = dealEntry(h).set;
	const order = s.m[dealEntry(h).id].order;
	const open = st.pile_top !== 'down';
	for (const size of st.piles) {
		for (const seat of order) {
			const cards = s.rest.splice(0, size);
			s.piles[seat].push({ cards, open });
			s.hands[seat].push(...cards);
		}
	}
	for (const seat of order) sortCards(s.hands[seat]);
	return { e: 'dealt', round: 1 };
}

export function roundsLeft(h) {
	const d = h.s.m[dealEntry(h).id];
	return d.rounds.length - d.round;
}

export function dealRound(h) {
	const s = h.s;
	const d = s.m[dealEntry(h).id];
	const row = d.rounds[d.round];
	for (const seat of d.order) {
		const k = row[seat];
		const got = s.rest.splice(0, k);
		s.hands[seat].push(...got);
		sortCards(s.hands[seat]);
	}
	d.round++;
	return { e: 'dealt', round: d.round };
}

// the undealt cards: out of play, or the prize stock
export function finish(h) {
	const s = h.s;
	const d = s.m[dealEntry(h).id];
	if (d.finished) return;
	d.finished = true;
	if (d.dead === 'prize') { s.stock = s.rest; s.rest = []; }
}

export function enter(h) {
	const s = h.s;
	start(h, s.seed, s.preset || null);
	s.preset = null;
	const events = [];
	const st = dealEntry(h).set;
	if (laterRound(h) && s.rest.length < cardsNeeded(h)) {
		s.stockEmpty = true;
		return { events: [{ e: 'stock_empty' }], done: true };
	}
	if (Array.isArray(st.piles)) {
		events.push(dealPiles(h));
		finish(h);
		return { events, done: true };
	}
	const windows = h.aMonteWindows();
	if (windows === 'packet') {
		events.push(dealRound(h)); // the a_monte phase deals the others, window by window
		return { events, done: true };
	}
	while (roundsLeft(h) > 0) events.push(dealRound(h));
	finish(h);
	return { events, done: true };
}

export function toAct() { return []; }
export function legal() { return []; }
export function apply() { return { ok: false }; }
