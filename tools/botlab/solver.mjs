// Seats of the lab that are not a level of bots/levels/: a level from a file, or a solver's own bot module.
// A solver bot is a module that exports chooseAction({game, view, level, seed}) -> {action, ...}, the contract of
// bots/index.js. The harness hands it the view of its own seat and nothing else (a deep copy, so it cannot reach the
// hand through shared objects), and the answer must be one of view.legal.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLevel } from '../../bots/index.js';

// an error the lab reports in one clear line (the hand and its seed when a bot is at fault) and stops on, never replacing a move
export class SolverError extends Error {}

export function levelFromFile(file) {
	let json;
	try { json = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new SolverError(`level file ${file}: ${e.message}`); }
	try { return { json, level: parseLevel(json) }; } catch (e) { throw new SolverError(`level file ${file}: ${e.message}`); }
}

// the file:// address of a module path (the workers load it by this address)
export const botUrl = (file) => pathToFileURL(path.resolve(file)).href;

export async function loadBot(url) {
	let mod;
	try { mod = await import(url); } catch (e) { throw new SolverError(`bot module ${url}: cannot be loaded (${e.message})`); }
	if (typeof mod.chooseAction !== 'function') throw new SolverError(`bot module ${url}: it must export chooseAction({game, view, level, seed})`);
	return mod.chooseAction;
}

const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((q) => [q, x[q]])) : x));

// Calls the solver's bot for one decision and checks the answer. ctx names the hand for the message.
// Returns the entry of view.legal that the bot chose (the lab applies that entry, never the bot's own object).
// The seed that a solver's bot gets: an irreversible print of the seed of the decision (the first 32 hex digits of its sha256).
// The seed of the decision is built from the seed of the deal, so the bot must not get it as it is. The same decision gives the same print.
export const solverSeed = (seed) => createHash('sha256').update(String(seed)).digest('hex').slice(0, 32);

export function askSolver(fn, { game, view, level, seed }, ctx) {
	const where = `solver bot, ${ctx.game}, hand ${ctx.h} (seed ${ctx.handSeed}), seat ${ctx.seat}, decision ${ctx.decision}`;
	let ans;
	try {
		ans = fn({ game, view: structuredClone(view), level, seed: solverSeed(seed) });
	} catch (e) {
		throw new SolverError(`${where}: the bot threw: ${String(e && e.message).slice(0, 200)}`);
	}
	if (ans && typeof ans.then === 'function') throw new SolverError(`${where}: chooseAction returned a promise; it must answer at once`);
	if (!ans || typeof ans !== 'object' || ans.action === null || typeof ans.action !== 'object') {
		throw new SolverError(`${where}: the answer must be {action: <one of view.legal>}, got ${String(canon(ans)).slice(0, 120)}`);
	}
	const key = canon(ans.action);
	const hit = view.legal.find((x) => canon(x) === key);
	if (!hit) throw new SolverError(`${where}: the action ${key.slice(0, 120)} is not in view.legal`);
	return { entry: hit, ans };
}
