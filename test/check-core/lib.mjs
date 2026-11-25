// Own helpers for these checks, written apart from the other test helpers on purpose.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand, makeRng, DECK } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const RULES = path.join(ROOT, 'rulesets');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(RULES, id + '.json'), 'utf8'));
export const allIds = () => fs.readdirSync(RULES).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
export const load = (id, seats, extra = {}) => loadGame(id, getFile, { seats, ...extra });
// load with the file of `id` changed in memory (the files on disk are never touched)
export function loadWith(id, seats, change, extra = {}) {
	const get = (x) => { const f = getFile(x); if (x === id) change(f); return f; };
	return loadGame(id, get, { seats, ...extra });
}
export const phaseOf = (file, id) => file.hand.phases.find((p) => p.id === id);

export const SIX = [
	['venticinque', 2], ['morto', 2], ['venticinque_3', 3], ['partita_3', 3], ['partita_4', 4],
	['meno', 2], ['meno', 3], ['meno', 4], ['meno', 5], ['meno', 6], ['meno', 7],
];

// every card of the hand, wherever it lies
export function everywhere(h) {
	const sn = h.snapshot();
	const out = [];
	for (const k of Object.keys(sn.hands)) out.push(...sn.hands[k], ...sn.discard[k], ...sn.won[k]);
	out.push(...sn.rest, ...sn.stock, ...sn.trick.map((t) => t.card));
	return out;
}

export function conserved(h) {
	const c = everywhere(h);
	return c.length === 78 && new Set(c).size === 78;
}

// plays to the end; pick(h, seat, legal, rng) chooses (random by default); each(h) after every action
export function playOut(h, { seed = 'p', pick, each } = {}) {
	const rng = makeRng('v1:' + seed);
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 4000) throw new Error('the hand does not end');
		const ta = h.toAct();
		if (!ta.length) throw new Error('nobody to act');
		const seat = ta[rng.int(ta.length)];
		const legal = h.legal(seat);
		if (!legal.length) throw new Error('no legal action');
		const a = pick ? pick(h, seat, legal, rng) : chooseAction(legal, rng);
		const r = h.apply(seat, a);
		if (!r.ok) throw new Error('refused ' + JSON.stringify(r) + ' ' + JSON.stringify(a));
		if (each) each(h, seat, a, r);
	}
	return h;
}

// first legal action that is not an a monte proposal
export const firstPick = (h, seat, legal) => legal.find((a) => a.type !== 'a_monte_propose') || legal[0];

export function presetOf(hands, rest) {
	const o = {};
	hands.forEach((l, i) => { o[String(i)] = l; });
	return { hands: o, rest };
}

// fill each seat up to sizes[seat]: listed cards first, then cards not banned, in canonical order
export function deal(sizes, wants, { ban = [], restFirst = [] } = {}) {
	const used = new Set([...wants.flat(), ...restFirst]);
	const pool = DECK.filter((c) => !used.has(c));
	const hands = sizes.map((_, i) => [...(wants[i] || [])]);
	sizes.forEach((n, seat) => {
		while (hands[seat].length < n) {
			const at = pool.findIndex((c) => !(ban[seat] && ban[seat](c)));
			if (at < 0) throw new Error('cannot fill seat ' + seat);
			hands[seat].push(pool.splice(at, 1)[0]);
		}
	});
	return presetOf(hands, [...restFirst, ...pool]);
}

export const isTrump = (c) => /^T\d+$/.test(c);
export const suitOf = (c) => (isTrump(c) ? 'trump' : c.split(':')[0]);

export function newH(game, seed, dealer, extra = {}) {
	return newHand(game, { seed, dealer, ...extra });
}

// card ids inside a JSON value
export function idsIn(v, out = new Set()) {
	if (typeof v === 'string') { if (DECK.includes(v)) out.add(v); }
	else if (Array.isArray(v)) v.forEach((x) => idsIn(x, out));
	else if (v && typeof v === 'object') Object.values(v).forEach((x) => idsIn(x, out));
	return out;
}

// what a seat may know: own hand, own discard, cards played in public, the prize cards shown to it, partners' hands
export function allowedIds(h, seat) {
	const sn = h.snapshot();
	const ok = new Set([...sn.hands[seat], ...sn.discard[seat]]);
	for (const t of sn.trick) ok.add(t.card);
	for (const t of sn.tricks) for (const c of t.cards) ok.add(c.card);
	return ok;
}
