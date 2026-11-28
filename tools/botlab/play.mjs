// One hand of the lab: the core plays, every decision of a seat goes through bots/index.js chooseAction with that
// seat's view only. Used by the worker thread and by the tests. Never edits core/ or bots/.
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand } from '../../core/index.js';
import { livePoints } from '../../core/modules/count.js';
import { parseLevel, chooseAction } from '../../bots/index.js';
import { askSolver, SolverError } from './solver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets', id + '.json'), 'utf8'));

const levels = new Map();
export function levelOf(id) {
	if (!levels.has(id)) {
		const json = id === 'random' ? { id: 'random' } : JSON.parse(fs.readFileSync(path.join(ROOT, 'bots', 'levels', id + '.json'), 'utf8'));
		levels.set(id, parseLevel(json));
	}
	return levels.get(id);
}

// A level of a seat: from a file's parsed JSON when given, else by name from bots/levels/.
export const levelFor = (id, json) => (json ? parseLevel(json) : levelOf(id));

// The random robot picks among all legal actions, so at an own_turn window it would shout «fuora» before it is out and pay for
// it; that is noise in a measure of strength, not weakness of play. It claims only when it is right (the bots never bluff).
export function viewForLevel(level, view, hand, seat) {
	if (level.id === 'random' && view.fuora && view.legal.some((x) => x.type === 'claim_fuora') && view.legal.some((x) => x.type !== 'claim_fuora')
		&& livePoints(hand, seat) < view.fuora.target) return { ...view, legal: view.legal.filter((x) => x.type !== 'claim_fuora') };
	return view;
}

const games = new Map();
export function gameOf(id, seats, alts = []) {
	const key = id + ':' + seats + ':' + alts.join(',');
	if (!games.has(key)) games.set(key, loadGame(id, getFile, { seats, alts }));
	return games.get(key);
}

const sidesOf = (game) => game.sides.of;
export const isPairGame = (game) => new Set(sidesOf(game)).size < game.seats;
// Turns of a deal in the cyclic mode: level a sits once on every seat (once on every side in the games of pairs).
export const turnsOf = (game) => new Set(sidesOf(game)).size;

const lowWins = (game) => JSON.stringify(game.rules).includes('"fewest_points"');

// margin of a seat's side in book points (positive: good for it), from result.sidePoints
function marginOf(game, result, seat) {
	const sp = result.sidePoints ?? {};
	const mine = sp[sidesOf(game)[seat]];
	const others = Object.entries(sp).filter(([k]) => Number(k) !== sidesOf(game)[seat]).map(([, v]) => v);
	if (mine === undefined || !others.length) return 0;
	return lowWins(game) ? (Math.min(...others) - mine) / 12 : (mine - Math.max(...others)) / 12;
}

// credit of a seat's side for the hand: 1 if it wins alone, 1/k among k winning sides, the fair share on a tie
function creditOf(game, result, seat) {
	const of = sidesOf(game);
	const sides = new Set(of).size;
	const win = new Set(result.winners.map((s) => of[s]));
	if (!win.size) return 1 / sides;
	return win.has(of[seat]) ? 1 / win.size : 0;
}

// Money of a hand for the contract games: the net payment of a seat (received less paid), the contract, the declarer.
// Fields are present only when the result carries payments or a contract, so the old games keep their old records.
function moneyOf(result, aSeat) {
	const pays = result.payments ?? [];
	const out = {};
	if (result.contract !== undefined || pays.length || result.outcome === 'thrown_in') {
		out.money = pays.reduce((s, p) => s + (p.to === aSeat ? p.amount : 0) - (p.from === aSeat ? p.amount : 0), 0);
		out.thrownIn = result.outcome === 'thrown_in' ? 1 : 0;
	}
	if (result.contract !== undefined && result.declarer !== undefined && result.declarer !== null) {
		out.contract = result.contract;
		out.aDeclared = result.declarer === aSeat ? 1 : 0;
		out.declaredWon = result.winners.includes(result.declarer) ? 1 : 0;
		// the table's view (any seat declared): the money of the declarer, for the bots-alone measure
		const d = result.declarer;
		out.declarerMoney = pays.reduce((s, p) => s + (p.to === d ? p.amount : 0) - (p.from === d ? p.amount : 0), 0);
	}
	return out;
}

// spec: {id, seats, alts, seed, h, a (level id), b (level id), timing}
// Optional: aJson, bJson (a level file's JSON instead of the name); botFn (a solver's chooseAction for the seats of a, see
// solver.mjs; a wrong answer or a throw ends the hand with a record that has botError); onDecision(info) (a test hook).
// Hand h: dealer h mod n; the seat of level a is (h + floor(h/n)) mod n, so it meets every dealer position.
// The deal seed depends on (seed, game, h) only: the same deals for every pairing.
// Cyclic mode (spec.mode 'cyclic', spec.turn r): h is the number of the DEAL; the dealer is h mod n as before, the seat of level a is the
// turn r, and the deal is the same in every turn. The seed of a decision carries the role of the seat (A or B), the seat and the turn, so that
// the same level on both sides does not play the same hand again in every turn.
export function playHand(spec) {
	const { id, seats: n, alts = [], seed, h, a, b, timing = false } = spec;
	const game = gameOf(id, n, alts);
	const la = levelFor(a, spec.aJson);
	const lb = levelFor(b, spec.bJson);
	const of = sidesOf(game);
	const cyclic = spec.mode === 'cyclic';
	const aSeat = cyclic ? spec.turn : (h + Math.floor(h / n)) % n;
	const dealer = h % n;
	const gk = `${id}:${n}`;
	const hand = newHand(game, { seed: `${seed}:${gk}:${h}`, dealer });
	const count = new Array(n).fill(0);
	const ms = [];
	let worlds = 0;
	let searched = 0;
	let decisions = 0;
	let firstLeader = null;
	const fail = (what, extra = {}) => ({ h, ...(cyclic ? { turn: spec.turn } : {}), error: what, aSeat, dealer, seedOfHand: `${seed}:${gk}:${h}`, ...extra });
	for (let step = 0; step < 6000 && !hand.isOver(); step++) {
		const seat = hand.toAct()[0];
		const level = of[seat] === of[aSeat] ? la : lb;
		const view = viewForLevel(level, hand.view(seat), hand, seat);
		const dseed = cyclic
			? `${seed}|cyclic|${gk}|${h}|${of[seat] === of[aSeat] ? 'A' : 'B'}|${seat}|r${spec.turn}|${count[seat]++}`
			: `${seed}|${gk}|${h}|${seat}|${count[seat]++}`;
		const solver = spec.botFn && of[seat] === of[aSeat];
		if (spec.onDecision) spec.onDecision({ hand, seat, solver: !!solver });
		const t0 = performance.now();
		let ans;
		try {
			if (solver) {
				const r = askSolver(spec.botFn, { game, view, level, seed: dseed }, { game: gk, h, handSeed: `${seed}:${gk}:${h}`, seat, decision: decisions });
				ans = { action: r.entry, stats: r.ans.stats };
			} else ans = chooseAction({ game, view, level, seed: dseed });
		} catch (e) {
			if (e instanceof SolverError) return fail(e.message, { seat, botError: true });
			return fail('bot_threw: ' + String(e.message).slice(0, 120), { seat });
		}
		const dt = performance.now() - t0;
		decisions++;
		const mine = of[seat] === of[aSeat]; // times and worlds are the level a's only
		if (!mine) { /* the other level is not measured */ } else if (view.legal.length > 1) {
			if (timing) ms.push([dt, 1]);
			if (ans.stats && view.legal[0].type === 'play') { worlds += ans.stats.worlds; searched++; }
		} else if (timing) ms.push([dt, 0]);
		const r = hand.apply(seat, ans.action);
		if (!r.ok) return fail('refused: ' + r.code, { seat, action: ans.action });
		if (firstLeader === null && ans.action.type === 'play') firstLeader = seat;
	}
	if (!hand.isOver()) return fail('no_end');
	const result = hand.result();
	const money = moneyOf(result, aSeat);
	return {
		...money,
		h,
		...(cyclic ? { turn: spec.turn } : {}),
		aSeat,
		dealer,
		firstLeader,
		credit: creditOf(game, result, aSeat),
		margin: marginOf(game, result, aSeat),
		dealerCredit: creditOf(game, result, dealer),
		dealerMargin: marginOf(game, result, dealer),
		leaderCredit: firstLeader === null ? 0 : creditOf(game, result, firstLeader),
		tie: result.winners.length === 0 ? 1 : 0,
		falseClaims: ((hand.s.m.fuora && hand.s.m.fuora.claims) || []).filter((c) => !c.valid).length,
		decisions,
		worlds,
		searched,
		ms,
	};
}
