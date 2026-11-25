// Own helpers for these checks, written apart from the other test helpers on purpose.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand, newMatch, replayHand, makeRng, cardTwelfths } from '../../core/index.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const RULES = path.join(ROOT, 'rulesets');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(RULES, id + '.json'), 'utf8'));
export const load = (id, seats = 2) => loadGame(id, getFile, { seats });
export { newHand, newMatch, replayHand, makeRng };

export const NEW = [['sedici_2', 2], ['trentuno', 2], ['baronetti', 2]];

// the value of one card counted alone, in points
export function value(game, card) {
	const e = game.plan.find((x) => x.module === 'count');
	return cardTwelfths(game.tables.values, card, 1, e.set.plain_value) / 12;
}

// a fresh Sedici/Trent'uno hand at the start of the first trick; dealer 0, so seat 1 leads
export function fresh(game, seed = 'v') {
	const h = newHand(game, { seed, dealer: 0 });
	if (h.cur.module !== 'tricks') throw new Error('not at the tricks: ' + h.cur.module);
	return h;
}

// gives the seats exactly these hands (other cards back into the stock in their order); test-only surgery on plain state
export function setHands(h, hands) {
	const s = h.s;
	const want = new Set(Object.values(hands).flat());
	const pool = [];
	for (let q = 0; q < s.n; q++) pool.push(...s.hands[q]);
	pool.push(...s.rest);
	for (const c of want) if (!pool.includes(c)) throw new Error('card not free: ' + c);
	const free = pool.filter((c) => !want.has(c));
	for (let q = 0; q < s.n; q++) {
		const size = s.hands[q].length;
		s.hands[q] = hands[q] ? hands[q].slice() : free.splice(0, size);
		if (s.hands[q].length !== size) throw new Error('hand size changes');
	}
	s.rest = free;
}

// moves cards worth exactly `points` from the stock into the won cards of `seat` (no court cards above `max` value)
export function giveWon(h, seat, points) {
	const g = h.game;
	const cards = h.s.rest.filter((c) => value(g, c) > 0);
	const best = new Map([[0, []]]);
	for (const c of cards) {
		const v = value(g, c);
		for (const [sum, pick] of [...best]) if (sum + v <= points && !best.has(sum + v)) best.set(sum + v, [...pick, c]);
	}
	const take = best.get(points);
	if (!take) throw new Error('cannot make ' + points);
	h.s.rest = h.s.rest.filter((c) => !take.includes(c));
	h.s.won[seat].push(...take);
	return take;
}

export function must(r) {
	if (!r.ok) throw new Error('refused: ' + r.code + ' ' + r.why);
	return r;
}

// one random policy: claims a fuora when legal and `claimOk(h, seat)` is true, shows the Fool with probability pShow
export function playOut(h, rng, { claimOk = () => true, falseRate = 0, pShow = 0.5, each } = {}) {
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 6000) throw new Error('the hand does not end');
		const toAct = h.toAct();
		const seat = toAct[rng.int(toAct.length)];
		const L = h.legal(seat);
		const claim = L.find((a) => a.type === 'claim_fuora');
		const show = L.find((a) => a.type === 'show_fool');
		const plays = L.filter((a) => a.type === 'play');
		let a;
		if (claim && (claimOk(h, seat) || rng.int(1000) < falseRate * 1000)) a = claim;
		else if (show && rng.int(1000) < pShow * 1000) a = show;
		else a = plays.length ? plays[rng.int(plays.length)] : L[rng.int(L.length)];
		const r = must(h.apply(seat, a));
		if (each) each(h, seat, a, r.events);
	}
	return h;
}

// the claim is right when the seat's live points reach the target
export const rightClaim = (h, seat) => {
	const f = h.hooks().find((e) => e.module === 'fuora');
	const v = h.view(seat);
	return v.points && v.points.mine >= f.set.target;
};
