// Helpers of the core tests: read the game files, play random hands, check the invariants.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand, makeRng, DECK } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../rulesets');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8'));
// a game whose file is changed by `patch(file)` first (a copy: the files on disk are never touched)
export function loadPatched(id, seats, patch, extra = {}) {
	const get = (x) => { const f = getFile(x); if (x === id) patch(f); return f; };
	return loadGame(id, get, { seats, ...extra });
}
export const load = (id, seats, extra = {}) => loadGame(id, getFile, { seats, ...extra });

// the games and seat counts the core tests play
export const CASES = [
	['venticinque', 2], ['morto', 2], ['venticinque_3', 3], ['partita_3', 3], ['partita_4', 4],
	['meno', 2], ['meno', 4], ['meno', 5], ['meno', 7],
];

// the cards on the table, wherever they are (every card exactly once)
export function allCards(h) {
	const s = h.s;
	const out = [];
	for (const l of s.hands) out.push(...l);
	for (const l of s.discard) out.push(...l);
	for (const l of s.won) out.push(...l);
	out.push(...s.rest, ...s.stock, ...s.trick.map((t) => t.card));
	return out;
}

export function checkConserved(h) {
	const cards = allCards(h);
	if (cards.length !== DECK.length || new Set(cards).size !== DECK.length) throw new Error('cards are not conserved: ' + cards.length);
}

// plays a hand with random legal actions; `each` is called after every accepted action
export function playRandom(game, seed, dealer, each, opts = {}) {
	const rng = makeRng('bot:' + seed);
	const h = newHand(game, { seed, dealer, ...opts });
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 5000) throw new Error('a hand does not end');
		const toAct = h.toAct();
		if (!toAct.length) throw new Error('nobody to act in a hand that is not over');
		const seat = toAct[rng.int(toAct.length)];
		const action = chooseAction(h.legal(seat), rng);
		if (!action) throw new Error('no legal action for a seat to act');
		const r = h.apply(seat, action);
		if (!r.ok) throw new Error('a legal action was refused: ' + JSON.stringify(r));
		if (each) each(h, seat, action);
	}
	return h;
}

export function preset(hands, rest) {
	const o = {};
	hands.forEach((l, i) => { o[String(i)] = l; });
	return { hands: o, rest };
}

// the cards of the deck that are not in the lists, in canonical order
export function others(...lists) {
	const used = new Set(lists.flat());
	return DECK.filter((c) => !used.has(c));
}

// a deal for `sizes` cards per seat: the wanted cards first, then fillers the seat may hold, the rest to the stock
export function build(sizes, wants, bans = [], restFirst = []) {
	const used = new Set([...wants.flat(), ...restFirst]);
	const pool = DECK.filter((c) => !used.has(c));
	const hands = wants.map((w) => [...w]);
	const order = sizes.map((_, i) => i).sort((a, b) => (bans[b] ? 1 : 0) - (bans[a] ? 1 : 0));
	for (const seat of order) {
		while (hands[seat].length < sizes[seat]) {
			const at = pool.findIndex((c) => !bans[seat] || !bans[seat](c));
			if (at < 0) throw new Error('cannot fill seat ' + seat);
			hands[seat].push(pool.splice(at, 1)[0]);
		}
	}
	return preset(hands, [...restFirst, ...pool]);
}


// the dealer puts three filler cards away (not the cards we protect)
export function discardNow(h, keep) {
	while (h.s.phase === 'discard') {
		const seat = h.toAct()[0];
		const a = h.legal(seat).find((x) => !keep.includes(x.card));
		if (!a) throw new Error('no card to discard');
		if (!h.apply(seat, a).ok) throw new Error('discard refused');
	}
}

