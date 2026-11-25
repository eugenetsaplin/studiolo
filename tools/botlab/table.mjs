// One hand with a player at every seat, for tools/play.mjs: each seat has a level (a name of bots/levels/, a level file) or a
// solver's bot module. Every decision goes through chooseAction with the view of that seat only. Same seed, same hand.
// Seat specs: "random", "easy"|"normal"|"strong" (bots/levels/), "<file>.json" (a level file), "bot:<module>" (a solver bot,
// played at level normal).
import path from 'node:path';
import { loadGame, newHand } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { getFile, levelOf, levelFor, viewForLevel } from './play.mjs';
import { askSolver, SolverError, levelFromFile, botUrl, loadBot } from './solver.mjs';

export async function resolvePlayers(specs) {
	const out = [];
	for (const spec of specs) {
		if (spec.startsWith('bot:')) {
			const file = spec.slice(4);
			out.push({ label: spec, level: levelOf('normal'), botFn: await loadBot(botUrl(file)) });
		} else if (spec.endsWith('.json')) {
			out.push({ label: path.basename(spec), level: levelFor(null, levelFromFile(spec).json), botFn: null });
		} else {
			let level;
			try { level = levelOf(spec); } catch { throw new SolverError(`bots: "${spec}" is not random, a level of bots/levels/, a level file or bot:<module>`); }
			out.push({ label: spec, level, botFn: null });
		}
	}
	return out;
}

const games = new Map();
export function tableGame(id, seats, variant) {
	const key = `${id}:${seats}:${variant ?? ''}`;
	if (!games.has(key)) {
		try { games.set(key, loadGame(id, getFile, { seats, variant: variant ?? null })); } catch (e) { throw new SolverError(`game ${id}, ${seats} seats${variant ? ', variant ' + variant : ''}: ${e.message}`); }
		if (!games.get(key).support.runnable) throw new SolverError(`game ${id}: the core does not play it (support.runnable is false)`);
	}
	return games.get(key);
}

// The key of a game in the seeds: id:seats, with :variant when a variant is set.
export const gameKey = (id, seats, variant) => `${id}:${seats}${variant ? ':' + variant : ''}`;

// spec: {id, seats, variant, seed, h, dealer}; players: from resolvePlayers. Returns {hand, handSeed, steps, finished}
// steps: [{seat, action, events}]. Throws SolverError when a solver's bot throws or answers outside view.legal.
export function playTable(spec, players) {
	const { id, seats: n, variant = null, seed, h } = spec;
	const game = tableGame(id, n, variant);
	const gk = gameKey(id, n, variant);
	const dealer = spec.dealer ?? h % n;
	const handSeed = `${seed}:${gk}:${h}`;
	const hand = newHand(game, { seed: handSeed, dealer });
	const count = new Array(n).fill(0);
	const steps = [];
	for (let step = 0; step < 6000 && !hand.isOver(); step++) {
		const seat = hand.toAct()[0];
		const p = players[seat];
		const view = viewForLevel(p.level, hand.view(seat), hand, seat);
		const dseed = `${seed}|${gk}|${h}|${seat}|${count[seat]++}`;
		let action;
		if (p.botFn) action = askSolver(p.botFn, { game, view, level: p.level, seed: dseed }, { game: gk, h, handSeed, seat, decision: step }).entry;
		else {
			try { action = chooseAction({ game, view, level: p.level, seed: dseed }).action; } catch (e) { throw new SolverError(`${p.label}, ${gk}, hand ${h} (seed ${handSeed}), seat ${seat}: the bot threw: ${String(e.message).slice(0, 160)}`); }
		}
		const r = hand.apply(seat, action);
		if (!r.ok) throw new SolverError(`${p.label}, ${gk}, hand ${h} (seed ${handSeed}), seat ${seat}: the core refused a legal action (${r.code})`);
		steps.push({ seat, action, events: r.events ?? [] });
	}
	return { game, hand, handSeed, dealer, steps, finished: hand.isOver() };
}

// net payment of every seat (received less paid) of a finished hand, or null when the hand has no payments
export function moneyBySeat(result, seats) {
	const pays = result.payments ?? [];
	if (!pays.length && result.contract === undefined && result.outcome !== 'thrown_in') return null;
	const net = new Array(seats).fill(0);
	for (const p of pays) { net[p.to] += p.amount; net[p.from] -= p.amount; }
	return net;
}
