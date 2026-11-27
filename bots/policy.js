// Simple, documented policies. They read the RULES of the game (settings by module and key), never a game id.
//  - greedyPlay: a cheap generic heuristic for a trick card (used by the "greedy" rollout and as a fallback bot).
//  - greedyDiscard: which card to put away.
//  - foolGive: the plain card the Fool's owner gives.
//  - monte: the deal-throwing votes and proposals (judged on the cards dealt so far).
import { INFO, FOOL, ALL, INDEX } from '../core/cards.js';
import { countTwelfths } from '../core/points.js';
import { countEntry } from '../core/score.js';

const cache = new WeakMap();

// the contracts of the game file, lowest first (the order of the auction), as {id, exchange, rank, onoranza}
function contractList(game) {
	return (game.contracts || []).map((c, i) => ({ id: c.id, exchange: c.exchange || 0, rank: c.rank === undefined ? i : c.rank, onoranza: c.onoranza || 0 })).sort((a, b) => a.rank - b.rank);
}

export const catOf = (c) => (INFO[c].trump ? 'trump' : INFO[c].suit);

// Everything the policies need from a Game, computed once per Game object.
export function ctxOf(game) {
	let c = cache.get(game);
	if (c) return c;
	const entry = (m) => game.plan.find((e) => e.module === m);
	const result = entry('result');
	const discard = entry('discard');
	const val = game.tables.values.v;
	let total = 0;
	for (const id of ALL) total += val[id] - 1;
	const fuora = [...((game.hooks && game.hooks.tricks) || []), ...game.plan].find((e) => e.module === 'fuora');
	const count = entry('count');
	// the count phase of the contract played (a file may count a free game by its own rule), as options of countTwelfths
	const countOf = (contract) => {
		const e = countEntry(game, contract);
		return e ? { table: game.tables.values, group: e.set.group, oddCard: e.set.odd_card, plainValue: e.set.plain_value } : null;
	};
	c = {
		game,
		// cards.fool "trump": the Fool is an ordinary (lowest) trionfo; every excuse special case is for "excuse" only
		foolTrump: game.cfg.cards.fool === 'trump',
		firstOut: !!result && result.set.winner === 'first_out',
		target: fuora && Number.isFinite(fuora.set.target) ? fuora.set.target : null,
		firstReached: !!fuora && fuora.set.winner_is === 'first_reached',
		countOpts: count ? countOf(null) : null,
		countOf,
		sign: result && result.set.winner === 'fewest_points' ? -1 : 1,
		val,
		strength: (id) => (INFO[id].trump ? game.tables.trumpStrength[id] || 0 : game.tables.suitStrength[id]),
		keepsDiscard: !discard || discard.set.counts_for !== 'nobody',
		meanExtra: total / ALL.length,
		sideOf: game.sides.of,
		contracts: contractList(game),
		seatCount: game.seats,
		hasContracts: game.plan.some((e) => e.module === 'bidding'),
	};
	cache.set(game, c);
	return c;
}

// the strength of a card in a trick whose led suit is `led` (-1: it cannot win)
function keyOf(ctx, id, led) {
	if (id === FOOL && !ctx.foolTrump) return -1;
	if (INFO[id].trump) return 1000 + ctx.strength(id);
	return INFO[id].suit === led ? ctx.strength(id) : -1;
}

function byCheap(ctx, a, b) { // fewer points first, then weaker
	return ctx.val[a] - ctx.val[b] || ctx.strength(a) - ctx.strength(b) || INDEX[a] - INDEX[b];
}

const pick = (cards, cmp) => cards.reduce((best, c) => (best === null || cmp(c, best) < 0 ? c : best), null);

// table: [{seat, card}] of the open trick, in order. Returns one of the `legal` play actions.
export function greedyPlay(ctx, legal, table, seat, sideOf = ctx.sideOf) {
	const cards = legal.map((a) => a.card);
	const plain = ctx.foolTrump ? cards : cards.filter((c) => c !== FOOL);
	const act = (c) => legal[cards.indexOf(c)];
	if (!plain.length) return legal[0];
	const cheap = (a, b) => byCheap(ctx, a, b);
	const dear = (a, b) => -byCheap(ctx, a, b);
	if (table.length === 0) {
		const suits = plain.filter((c) => !INFO[c].trump);
		return act(pick(suits.length ? suits : plain, cheap));
	}
	const first = table.find((t) => ctx.foolTrump || t.card !== FOOL);
	const led = first ? catOf(first.card) : null;
	let bestKey = -1;
	let bestSeat = null;
	let tablePts = 0;
	for (const t of table) {
		tablePts += ctx.val[t.card];
		const k = keyOf(ctx, t.card, led);
		if (k > bestKey) { bestKey = k; bestSeat = t.seat; }
	}
	const wins = plain.filter((c) => keyOf(ctx, c, led === null ? catOf(c) : led) > bestKey);
	const loses = plain.filter((c) => !wins.includes(c));
	if (ctx.sign < 0) { // fewest points wins: give the points away, win only when forced
		if (loses.length) return act(pick(loses, dear));
		return act(pick(wins, cheap));
	}
	const mate = bestSeat !== null && bestSeat !== seat && sideOf[bestSeat] === sideOf[seat];
	if (!mate && wins.length) {
		const w = pick(wins, cheap);
		const honours = tablePts > table.length;
		if (!INFO[w].trump || honours) return act(w);
	}
	return act(pick(loses.length ? loses : plain, cheap));
}

// hand: the discarder's cards. A discard that counts for the discarder is points kept: put the dearest away;
// otherwise get rid of the cheapest. Ties: the shortest suit (a void helps), then the weakest.
export function greedyDiscard(ctx, legal, hand) {
	const len = {};
	for (const c of hand) len[catOf(c)] = (len[catOf(c)] || 0) + 1;
	const sign = ctx.keepsDiscard ? -1 : 1;
	const cmp = (a, b) => sign * (ctx.val[a] - ctx.val[b]) || len[catOf(a)] - len[catOf(b)] || ctx.strength(a) - ctx.strength(b) || INDEX[a] - INDEX[b];
	const c = pick(legal.map((a) => a.card), cmp);
	return legal.find((a) => a.card === c);
}

export function foolGive(ctx, legal) {
	const c = pick(legal.map((a) => a.card), (a, b) => ctx.val[a] - ctx.val[b] || INDEX[a] - INDEX[b]);
	return legal.find((a) => a.card === c);
}

// Hand strength on the cards dealt so far: the points above the plain value, plus a little for high trumps.
function strengthOf(ctx, hand) {
	let s = 0;
	for (const c of hand) s += ctx.val[c] - 1 + (INFO[c].trump && INFO[c].num >= 15 ? 0.5 : 0);
	return s - hand.length * ctx.meanExtra;
}

// Deal-throwing: propose (when asked) or agree (when voting) with a clearly poor hand; never otherwise.
export function monte(ctx, view) {
	const find = (t) => view.legal.find((a) => a.type === t);
	const poor = strengthOf(ctx, view.hand) < -2;
	if (view.aMonte && view.aMonte.stage === 'vote') return (poor ? find('a_monte_agree') : find('a_monte_refuse')) || view.legal[0];
	return (poor ? find('a_monte_propose') : find('a_monte_pass')) || view.legal[0];
}

// ---- fuora: points and the two policies for the non-card actions ----

// Book points (twelfths / 12) of a list of cards, counted by the count phase's settings (the fallback when the view
// carries no view.points).
export function pointsOfCards(ctx, cards, contract = null) {
	const o = contract === null || contract === undefined ? ctx.countOpts : ctx.countOf(contract);
	if (!o) return 0;
	return countTwelfths(cards, { table: o.table, group: o.group || 1, oddCard: o.oddCard || 'half_point', plainValue: o.plainValue === undefined ? 1 : o.plainValue }) / 12;
}

// The cards a seat has taken so far, from a view: the cards of the tricks it won (an excuse Fool goes back to its owner)
// plus the cards it showed. Everything in it is public.
export function cardsOf(ctx, view, seat) {
	const cards = [];
	for (const t of view.tricks) {
		for (const { seat: q, card } of t.cards) {
			if (card === FOOL && !ctx.foolTrump) { if (q === seat) cards.push(card); } else if (t.winner === seat) cards.push(card);
		}
	}
	const shown = view.open_piles && view.open_piles.shown && view.open_piles.shown[seat];
	if (shown) cards.push(...shown);
	return cards;
}

// The seat's own book points so far in the whole hand, from a view: view.points.mine, else the cards of the tricks it
// won (an excuse Fool goes back to its owner) plus the cards it showed.
export function ownPoints(ctx, view) {
	if (view.points && typeof view.points.mine === 'number') return view.points.mine;
	return pointsOfCards(ctx, cardsOf(ctx, view, view.seat), view.contract ? view.contract.id : null);
}

// The same from a sampled Hand (rollouts): the cards won and the cards shown.
export function handPoints(ctx, hand, seat) {
	const sh = hand.s.shown && hand.s.shown[seat];
	return pointsOfCards(ctx, sh && sh.length ? [...hand.s.won[seat], ...sh] : hand.s.won[seat], hand.s.contract);
}

// claim_fuora exactly when the points reach the target: never a false claim. Returns the action or null.
export function claimAction(ctx, view) {
	const a = view.legal.find((x) => x.type === 'claim_fuora');
	const target = ctx.target !== null ? ctx.target : view.fuora && view.fuora.target;
	if (!a || !Number.isFinite(target)) return null;
	return ownPoints(ctx, view) >= target ? a : null;
}

// A card that wins the game now (revision 11, the first of the two tactical answers of the outside report): the seat plays
// the last card of the trick, the card takes the trick, and the cards it then holds make the target. The claim follows at
// once (claimAction), so the move is a certain win. Only public facts and the seat's own cards are used. Under "first
// reached" wins the game goes to the seat that made the target first, so the move is certain only when no other seat has
// made it. null when there is no such card.
export function winNowAction(ctx, view) {
	if (ctx.target === null || !ctx.firstOut) return null;
	const table = view.trick.cards;
	if (!table.length || table.length !== view.seats - 1) return null;
	if (!ctx.foolTrump && table.some((t) => t.card === FOOL)) return null; // the Fool's trick is not read here
	const plays = view.legal.filter((a) => a.type === 'play' && (ctx.foolTrump || a.card !== FOOL));
	if (!plays.length) return null;
	const led = catOf(table[0].card);
	let top = -1;
	for (const t of table) top = Math.max(top, keyOf(ctx, t.card, led));
	const contract = view.contract ? view.contract.id : null;
	if (ctx.firstReached) {
		for (let q = 0; q < view.seats; q++) if (q !== view.seat && pointsOfCards(ctx, cardsOf(ctx, view, q), contract) >= ctx.target) return null;
	}
	const mine = cardsOf(ctx, view, view.seat);
	const trick = table.map((t) => t.card);
	for (const a of plays) {
		if (keyOf(ctx, a.card, led) > top && pointsOfCards(ctx, [...mine, ...trick, a.card], contract) >= ctx.target) return a;
	}
	return null;
}

// show_fool at once when offered: showing the Fool loses nothing and the next card of its pile turns early.
export function showAction(view) {
	return view.legal.find((x) => x.type === 'show_fool') || null;
}

// the same two choices inside a rollout (legal: the actions of the acting seat)
export function extraAction(ctx, hand, seat, legal) {
	const c = legal.find((x) => x.type === 'claim_fuora');
	if (c && ctx.target !== null && handPoints(ctx, hand, seat) >= ctx.target) return c;
	return legal.find((x) => x.type === 'show_fool') || null;
}

// ---- contracts: bidding, the exchange, calling, declarations (no sampling: policies on the cards held) ----

// Tuned by the lab: the hand's worth in units of an average hand, and the bar a bid has to clear.
export const TUNE = { bar: 1.7, perSeat: 0.22, perExchange: 0.05 }; // the lab may change these; the bot never does
const AVG_PER_CARD = 25.1 / 78; // the mean worth of a card of the deck, see worthOf

// What a hand is worth for a lone declarer: trumps above the tenth, the highest trumps twice, kings, queens, low trumps a little.
export function worthOf(cards) {
	let w = 0;
	for (const c of cards) {
		const i = INFO[c];
		if (i.trump) {
			if (i.num > 10) w += 1 + (i.num >= 16 ? 1 : 0);
			else if (!i.fool) w += 0.25;
		} else if (i.rank === 'K') w += 1;
		else if (i.rank === 'Q') w += 0.4;
	}
	return w;
}

export const highTrumps = (cards) => cards.filter((c) => INFO[c].trump && INFO[c].num > 10).length;

// the id of a bid action (bid_<id>)
const bidId = (a) => a.type.slice(4);

// bid: the highest contract the hand is expected to win, else pass; only among the legal bids
export function bidAction(ctx, cards, legal, bidding = null) {
	const pass = legal.find((a) => a.type === 'pass') || null;
	const bids = legal.filter((a) => a.type.startsWith('bid_'));
	if (!bids.length) return pass || legal[0];
	const ratio = worthOf(cards) / (Math.max(1, cards.length) * AVG_PER_CARD);
	const bar = TUNE.bar + TUNE.perSeat * (ctx.seatCount - 3);
	if (highTrumps(cards) < 3) return pass || bids[0];
	// a bid below the standing one is never legal; one equal to it is in the list only for a seat that may match it, and is judged like the rest
	const standing = bidding && bidding.best ? ctx.contracts.find((x) => x.id === bidding.best.contract) : null;
	let best = null;
	for (const a of bids) {
		const c = ctx.contracts.find((x) => x.id === bidId(a));
		if (!c || (standing && c.rank < standing.rank)) continue;
		if (ratio + TUNE.perExchange * c.exchange >= bar && (!best || c.rank > best.rank)) best = { a, rank: c.rank };
	}
	return best ? best.a : pass || bids[0];
}

// lay_down: the cheapest cards of the shortest suits, plain suits first; never lay_done while a card can be laid
export function layAction(ctx, cards, legal) {
	const downs = legal.filter((a) => a.type === 'lay_down');
	if (!downs.length) return legal.find((a) => a.type === 'lay_done') || legal[0];
	const len = {};
	for (const c of cards) len[catOf(c)] = (len[catOf(c)] || 0) + 1;
	const cmp = (a, b) => (INFO[a].trump ? 1 : 0) - (INFO[b].trump ? 1 : 0) || ctx.val[a] - ctx.val[b] || len[catOf(a)] - len[catOf(b)] || ctx.strength(a) - ctx.strength(b) || INDEX[a] - INDEX[b];
	const c = pick(downs.map((a) => a.card), cmp);
	return downs.find((a) => a.card === c);
}

// call: the strongest cards the hand lacks (high trumps, then the kings of its long suits), by a fixed score
export function callAction(ctx, cards, legal) {
	const len = {};
	for (const c of cards) len[catOf(c)] = (len[catOf(c)] || 0) + 1;
	const score = (c) => {
		const i = INFO[c];
		if (i.trump) return i.fool ? 30 : i.num > 10 ? 50 + i.num : 5 + i.num;
		return i.rank === 'K' ? 40 + 2 * (len[i.suit] || 0) : i.rank === 'Q' ? 20 + (len[i.suit] || 0) : ctx.strength(c) * 0.01;
	};
	const calls = legal.filter((a) => a.type === 'call');
	if (!calls.length) return legal[0];
	const c = pick(calls.map((a) => a.card), (a, b) => score(b) - score(a) || INDEX[a] - INDEX[b]);
	return calls.find((a) => a.card === c);
}

// call_partner: the highest rank of the ladder offered, in the suit where the hand is longest and holds a high card;
// never a card of its own hand while another can be called (a card of its own is played alone)
export function callPartnerAction(ctx, cards, legal) {
	const calls = legal.filter((a) => a.type === 'call_partner');
	if (!calls.length) return legal[0];
	const held = new Set(cards);
	const others = calls.filter((a) => !held.has(a.card));
	const list = others.length ? others : calls;
	const mine = (suit) => cards.filter((c) => INFO[c].suit === suit);
	const high = (suit) => mine(suit).filter((c) => ctx.val[c] >= 3).length;
	const c = pick(list.map((a) => a.card), (a, b) => mine(INFO[b].suit).length - mine(INFO[a].suit).length || high(INFO[b].suit) - high(INFO[a].suit) || INDEX[a] - INDEX[b]);
	return list.find((a) => a.card === c);
}

// declarations: declare everything offered, one at a time, then declare_done
export function declareAction(legal) {
	return legal.find((a) => a.type.startsWith('declare_') && a.type !== 'declare_done') || legal.find((a) => a.type === 'declare_done') || null;
}

const CONTRACT_TYPES = (t) => t === 'pass' || t === 'lay_down' || t === 'lay_done' || t === 'call' || t === 'call_partner' || t.startsWith('bid_') || t.startsWith('declare_');
export const isContractLegal = (legal) => legal.some((a) => CONTRACT_TYPES(a.type));

// The answer for a view or a sampled hand whose legal list holds contract actions; null when it holds none.
// cards: the hand of the acting seat; bidding: view.bidding (the standing bid).
export function contractAction(ctx, cards, legal, bidding = null) {
	const d = declareAction(legal);
	if (d) return d;
	if (legal.some((a) => a.type === 'lay_down' || a.type === 'lay_done')) return layAction(ctx, cards, legal);
	if (legal.some((a) => a.type === 'call')) return callAction(ctx, cards, legal);
	if (legal.some((a) => a.type === 'call_partner')) return callPartnerAction(ctx, cards, legal);
	if (legal.some((a) => a.type === 'pass' || a.type.startsWith('bid_'))) return bidAction(ctx, cards, legal, bidding);
	return null;
}
