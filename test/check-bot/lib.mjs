// Shared by the independent bot checks. Independent of test/bots/: own helpers, own deal builders.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand, makeRng, DECK } from '../../core/index.js';
import { parseLevel } from '../../bots/index.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets', id + '.json'), 'utf8'));
export const levelJson = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'bots', 'levels', id + '.json'), 'utf8'));
export const level = (id) => parseLevel(levelJson(id));
export const PAIRS = [['venticinque', 2], ['morto', 2], ['venticinque_3', 3], ['partita_3', 3], ['partita_4', 4], ['consiglio', 4], ['dottore', 5],
	['meno', 2], ['meno', 3], ['meno', 4], ['meno', 5], ['meno', 6], ['meno', 7]];
const games = new Map();
export function game(id, seats) {
	const k = id + ':' + seats;
	if (!games.has(k)) games.set(k, loadGame(id, getFile, { seats }));
	return games.get(k);
}
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const isLegal = (view, a) => view.legal.some((x) => same(x, a));

// A cheap level for bulk checks: every code path of PIMC, small budget.
export function tiny(extra = {}) {
	return parseLevel({ ...levelJson('normal'), id: 'tiny', worlds: 3, budget_plays: 1500, ...extra });
}

// The canonical position mover: never proposes a deal-throw (so a preset deal is never redealt), else uniform.
export function randomMove(legal, rng) {
	const pass = legal.find((a) => a.type === 'a_monte_pass') || legal.find((a) => a.type === 'a_monte_refuse');
	if (pass) return pass;
	return legal[rng.int(legal.length)];
}

// A full deal as a preset: run a hand to its first trick card (passing every deal-throw window), then read where
// every card was dealt. Returns {hands: {q: [ids]}, rest: [ids]} that newHand accepts.
export function dealPreset(g, seed, dealer) {
	const h = newHand(g, { seed, dealer });
	const rng = makeRng(seed + ':pre');
	while (!h.isOver() && h.cur.module !== 'tricks') {
		const q = h.toAct()[0];
		h.apply(q, randomMove(h.legal(q), rng));
	}
	const s = h.snapshot();
	const hands = {};
	for (let q = 0; q < g.seats; q++) hands[q] = [...s.hands[q], ...s.discard[q]];
	return { hands, rest: [...s.stock, ...s.rest] };
}

export function fromPreset(g, seed, dealer, preset, carry) {
	return newHand(g, { seed, dealer, preset: structuredClone(preset), carry });
}

// Plays a preset deal with randomMove, collecting the log; calls visit(hand, log) before each action.
export function playPreset(g, seed, dealer, preset, visit) {
	const h = fromPreset(g, seed, dealer, preset);
	const rng = makeRng(seed + ':play');
	const log = [];
	while (!h.isOver()) {
		const q = h.toAct()[0];
		if (visit && visit(h, log) === false) break;
		const a = randomMove(h.legal(q), rng);
		const r = h.apply(q, a);
		if (!r.ok) throw new Error('refused ' + r.code);
		log.push({ seat: q, a });
	}
	return h;
}

// Replays a log on a preset deal; null when any action is refused.
export function replay(g, seed, dealer, preset, log) {
	let h;
	try { h = fromPreset(g, seed, dealer, preset); } catch { return null; }
	for (const { seat, a } of log) if (!h.apply(seat, a).ok) return null;
	return h;
}

// The cards the seat can see in its view.
export function knownTo(view) {
	const k = new Set([...view.hand, ...view.discard.mine, ...view.stock.drawn.map((d) => d.card)]);
	for (const t of view.tricks) for (const c of t.cards) k.add(c.card);
	for (const c of view.trick.cards) k.add(c.card);
	for (const q of Object.keys(view.partnerHands || {})) for (const c of view.partnerHands[q]) k.add(c);
	return k;
}

// Swaps two hidden cards in a preset (positions kept). Returns a new preset.
function swapIn(preset, a, b) {
	const p = structuredClone(preset);
	const lists = [...Object.values(p.hands), p.rest];
	for (const l of lists) for (let i = 0; i < l.length; i++) {
		if (l[i] === a) l[i] = b;
		else if (l[i] === b) l[i] = a;
	}
	return p;
}

// A twin deal: hidden cards swapped (between other hands, other discards, stock and rest, and the order of the rest),
// the log replayed; accepted only when the seat's view is deep-equal and the deal really differs.
export function twinOf(g, seed, dealer, preset, log, me, rng, swaps = 4) {
	const base = replay(g, seed, dealer, preset, log);
	const view = base.view(me);
	const known = knownTo(view);
	const hidden = DECK.filter((c) => !known.has(c));
	if (hidden.length < 2) return null;
	for (let tries = 0; tries < 40; tries++) {
		let p = preset;
		const perm = new Map();
		const at = (c) => (perm.has(c) ? perm.get(c) : c);
		for (let k = 0; k < swaps; k++) {
			const a = hidden[rng.int(hidden.length)];
			const b = hidden[rng.int(hidden.length)];
			if (a === b) continue;
			p = swapIn(p, a, b);
			// a hidden card in the log (another seat's discard) is renamed with the deal
			for (const [x, y] of [...perm.entries()]) perm.set(x, y === a ? b : y === b ? a : y);
			if (!perm.has(a)) perm.set(a, b);
			if (!perm.has(b)) perm.set(b, a);
		}
		if (same(p, preset)) continue;
		const log2 = log.map((e) => (e.a.card && e.seat !== me && !known.has(e.a.card) ? { seat: e.seat, a: { ...e.a, card: at(e.a.card) } } : e));
		const h = replay(g, seed, dealer, p, log2);
		if (!h) continue;
		const v = h.view(me);
		if (!same(v, view)) continue;
		if (same(h.snapshot().hands, base.snapshot().hands) && same(h.snapshot().rest, base.snapshot().rest) && same(h.snapshot().stock, base.snapshot().stock)
			&& same(h.snapshot().discard, base.snapshot().discard) && same(h.snapshot().won, base.snapshot().won)) continue;
		return { a: base, b: h, preset: p, discardsDiffer: !same(h.snapshot().discard, base.snapshot().discard) };
	}
	return null;
}

export function deepFreeze(o) {
	if (o && typeof o === 'object' && !Object.isFrozen(o)) {
		Object.freeze(o);
		for (const k of Object.keys(o)) deepFreeze(o[k]);
	}
	return o;
}

// Every position of one seat to decide (single seat to act), over `deals` random hands of a pair.
export function positions(g, tag, deals, filter = () => true) {
	const out = [];
	for (let d = 0; d < deals; d++) {
		const seed = `${tag}:${d}`;
		const dealer = d % g.seats;
		const preset = dealPreset(g, seed, dealer);
		playPreset(g, seed, dealer, preset, (h, log) => {
			const ta = h.toAct();
			if (ta.length !== 1) return;
			const v = h.view(ta[0]);
			if (filter(v, h)) out.push({ seed, dealer, preset, log: log.slice(), me: ta[0], view: v, hand: h.clone() });
		});
	}
	return out;
}
