// Helpers of the R9 general checks: every game file, every number of seats, every variant, every option value.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand, makeRng, countTwelfths } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../rulesets');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8'));
export const gameIds = () => fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();

const leaf = (x) => (x && typeof x === 'object' && !Array.isArray(x) && 'value' in x ? x.value : x);

export function seatCounts(id) {
	for (let f = getFile(id); f; f = f.extends ? getFile(f.extends) : null) {
		const c = f.seats && leaf(f.seats.count);
		if (c !== undefined) return Array.isArray(c) ? c : [c];
	}
	return [];
}

// every configuration to try: the game with each number of seats, each variant, and each value of each option
// (the variants and options are those of the merged file, the parents' included)
export function configs() {
	const out = [];
	for (const id of gameIds()) {
		for (const seats of seatCounts(id)) {
			const base = { id, seats };
			out.push({ ...base, label: `${id}/${seats}` });
			const rules = loadGame(id, getFile, { seats }).rules;
			// a variant may limit itself to some numbers of seats (patch.seats.count): it is not offered, so not tried, at the others
			for (const v of rules.variants || []) {
				const only = leaf(v.patch && v.patch.seats && v.patch.seats.count);
				if (Array.isArray(only) && !only.includes(seats)) continue;
				out.push({ ...base, variant: v.id, label: `${id}/${seats} variant ${v.id}` });
			}
			for (const o of rules.options || []) for (const val of o.choices) out.push({ ...base, options: { [o.id]: val }, label: `${id}/${seats} ${o.id}=${val}` });
		}
	}
	return out;
}

// the game of a configuration; throws when the file cannot be loaded or the core cannot play it
export function gameOf(c) {
	const g = loadGame(c.id, getFile, { seats: c.seats, variant: c.variant, options: c.options });
	if (!g.support.runnable) throw new Error('the core cannot play it: ' + g.support.missing.map((m) => `${m.path} ${m.why}`).join('; '));
	return g;
}

// plays one hand to its end with uniformly random legal actions; `before` is called before every action
export function playHand(game, seed, dealer = 0, before = null) {
	const rng = makeRng('r9:' + seed);
	const h = newHand(game, { seed, dealer });
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 6000) throw new Error('a hand does not end');
		const toAct = h.toAct();
		if (!toAct.length) throw new Error('nobody to act in a hand that is not over');
		const seat = toAct[rng.int(toAct.length)];
		const a = chooseAction(h.legal(seat), rng);
		if (!a) throw new Error('no legal action for a seat to act');
		if (before) before(h, seat, a);
		const r = h.apply(seat, a);
		if (!r.ok) throw new Error('a legal action was refused: ' + JSON.stringify(r));
	}
	return h;
}

// the cards that were counted at the end of the hand: all won cards and the discards that were given to somebody
export function countedCards(h) {
	const s = h.s;
	const cards = [];
	for (const l of s.won) cards.push(...l);
	return cards;
}

export { countTwelfths, makeRng };
