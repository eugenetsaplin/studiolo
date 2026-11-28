#!/usr/bin/env node
// The bot lab: bots against bots (and random robots) through the core, no server.
//   node tools/botlab.mjs --games runnable|<id:seats,...> --a <level> --b <level> --deals N --seed S
//        [--a-level <file.json>] [--b-level <file.json>] [--a-bot <module.mjs>]
//        [--workers W] [--alts [--only-alt <text of the path>]] [--timing] [--append] [--out <json>]
// Seat a plays the level a, the other seats the level b (pair games: a pair of a against a pair of b); seats rotate
// every hand; every decision goes through bots/index.js chooseAction with the view only. The deals depend on the
// seed and the hand number only, so every pairing plays the same deals. Reports go to WORK/botlab/.
// --a-level / --b-level: the level of seat a / of the other seats from a level file (the format of bots/levels/), instead of a name.
// --a-bot: seat a is played by your own bot, a module that exports chooseAction({game, view, level, seed}) -> {action, ...} like
// bots/index.js; the answer must be one of view.legal. The bot gets only the view of its seat (a copy), the level of a (--a-level
// or --a) and a seed string; a wrong answer or an exception stops the run with the hand number and its seed. Not with --alts, --alone.
// --timing: decision times (run with --workers 1 and nothing else running: parallel runs distort time).
// --mode cyclic: every deal is played once for every seat of level a (the others play level b); the observation is the mean over the
// deal, the interval is the paired Student interval over deals (--safe-t: the share with a wider, protected one). --deals is then the
// number of deals; --budget-games N plays N games in all (N / seats deals). Not with --alts, --alone, --timing.
// --alts: level a against itself on the same deals with the value and with each alt of the game file; one table.
// --alone: every seat plays level a (--b is ignored): the share of hands thrown in, the share with a declarer, the
// share the declarer won and its money per declared hand. --targets id:seats=alone checks at most 30 % thrown in and
// the declarer winning 45 % to 75 % of the declared hands.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame } from '../core/index.js';
import { WORK } from './workdir.mjs';
import { Pool } from './botlab/pool.mjs';
import { getFile, gameOf, isPairGame, turnsOf } from './botlab/play.mjs';
import { rowOf, cyclicRowOf } from './botlab/aggregate.mjs';
import { zShares, zMeans } from './botlab/stats.mjs';
import { SolverError, levelFromFile, botUrl, loadBot } from './botlab/solver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// every (game, seats) of the top-level game files that the core plays
export function runnablePairs() {
	const seatCounts = (id) => {
		for (let f = getFile(id); f; f = f.extends ? getFile(f.extends) : null) {
			const v = f.seats?.count?.value;
			if (v !== undefined) return [].concat(v);
		}
		return [];
	};
	const out = [];
	for (const f of fs.readdirSync(path.join(ROOT, 'rulesets')).filter((n) => n.endsWith('.json')).sort()) {
		const id = f.slice(0, -5);
		for (const seats of seatCounts(id)) {
			try { if (loadGame(id, getFile, { seats }).support.runnable) out.push({ id, seats }); } catch { /* not playable */ }
		}
	}
	return out;
}

// --targets id:seats=share,...: the strength target of a pair; for games with money, id:seats=money asks mean > 0 with its interval above 0
export function parseTargets(text) {
	const out = {};
	for (const part of String(text).split(',').filter(Boolean)) {
		const [k, v] = part.split('=');
		out[k] = v === 'money' || v === 'alone' ? v : Number(v);
	}
	return out;
}

// the bots-alone bar of the start page: at most 30 % of the hands thrown in, the declarer wins 45 % to 75 %
export const ALONE = { thrownMax: 0.3, wonMin: 0.45, wonMax: 0.75 };

export function verdict(r, targets = {}) {
	const t = targets[`${r.game}:${r.seats}`];
	if (t === undefined) return '';
	if (t === 'alone') {
		const tb = r.table;
		if (!tb || r.thrownIn === undefined) return ' ALONE n/a';
		const fails = [];
		if (r.thrownIn > ALONE.thrownMax) fails.push(`thrown in ${f2(r.thrownIn)} > ${ALONE.thrownMax}`);
		if (tb.declarerWon === null || tb.declarerWon < ALONE.wonMin || tb.declarerWon > ALONE.wonMax) fails.push(`declarer won ${tb.declarerWon === null ? '-' : f2(tb.declarerWon)} outside ${ALONE.wonMin}..${ALONE.wonMax}`);
		return fails.length ? ` ALONE FAIL (${fails.join('; ')})` : ' ALONE PASS';
	}
	if (t === 'money') {
		if (!r.money) return ' MONEY n/a';
		return r.money.lo > 0 ? ' MONEY PASS' : ` MONEY FAIL (lower bound ${f2(r.money.lo)} <= 0)`;
	}
	return r.lo > r.fair && r.share >= t ? ` TARGET PASS (>= ${t})` : ` TARGET FAIL (share ${f2(r.share)} vs ${t}, lower bound ${f2(r.lo)} vs fair ${f2(r.fair)}; short by ${f2(Math.max(t - r.share, r.fair - r.lo))})`;
}

export function parseArgs(argv) {
	const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
	const g = arg('--games', 'runnable');
	const label = (f) => path.basename(f).replace(/\.[^.]+$/, '');
	const aLevel = arg('--a-level', null), bLevel = arg('--b-level', null), aBotFile = arg('--a-bot', null);
	const a = arg('--a', 'normal'), b = arg('--b', 'random');
	return {
		aJson: aLevel ? levelFromFile(aLevel).json : null, bJson: bLevel ? levelFromFile(bLevel).json : null,
		aBot: aBotFile ? botUrl(aBotFile) : null,
		// names for the table and the file: the file's name for a level from a file, bot:<name> for a solver's bot
		aLabel: aBotFile ? 'bot:' + label(aBotFile) : aLevel ? label(aLevel) : a, bLabel: bLevel ? label(bLevel) : b,
		games: g === 'runnable' ? runnablePairs() : g.split(',').map((s) => { const [id, n] = s.split(':'); return { id, seats: Number(n) }; }),
		a, b,
		deals: Number(arg('--deals', 100)),
			mode: arg('--mode', 'unpaired'), budgetGames: arg('--budget-games', null) === null ? null : Number(arg('--budget-games', null)), dealsGiven: argv.includes('--deals'), safeT: argv.includes('--safe-t'),
			 seed: arg('--seed', 'lab'),
		workers: Number(arg('--workers', Math.max(1, os.availableParallelism() - 2))),
		alone: argv.includes('--alone'),
		alts: argv.includes('--alts'), timing: argv.includes('--timing'), append: argv.includes('--append'),
		out: arg('--out', null), onlyAlt: arg('--only-alt', null),
		targets: parseTargets(arg('--targets', '')),
	};
}

const rowKey = (r) => [r.game, r.seats, r.a, r.b, (r.alts ?? []).join(','), r.deals ?? '', r.mode === 'cyclic' ? 'cyclic' : ''].join('|');

function save(file, meta, rows, append) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	let old = [];
	if (append && fs.existsSync(file)) old = JSON.parse(fs.readFileSync(file, 'utf8')).rows ?? [];
	const keys = new Set(rows.map(rowKey));
	const all = [...old.filter((r) => !keys.has(rowKey(r))), ...rows];
	fs.writeFileSync(file, JSON.stringify({ meta, rows: all }, null, 1));
	return all;
}

const f2 = (x) => x.toFixed(3);
function moneyText(r) {
	if (!r.money) return '';
	const d = r.declaredWonShare === null ? 'no declarer' : `declared ${r.aDeclared} won ${f2(r.declaredWonShare)}`;
	// a minus the mean of the others: the game is zero-sum, so it is the money of a times n/(n-1)
	const v = r.moneyVsRest ? `, a minus the others ${f2(r.moneyVsRest.mean)} [${f2(r.moneyVsRest.lo)}..${f2(r.moneyVsRest.hi)}]` : '';
	return ` | money ${f2(r.money.mean)} [${f2(r.money.lo)}..${f2(r.money.hi)}] per hand, thrown in ${f2(r.thrownIn)}, ${d}, contracts ${JSON.stringify(r.contracts)}${v}`;
}
// the bots-alone line: the table, not seat a
export function aloneText(r) {
	const tb = r.table;
	if (!tb || r.thrownIn === undefined) return ' | alone: no money in this game';
	const m = tb.declarerMoney;
	const won = tb.declarerWon === null ? '-' : `${f2(tb.declarerWon)} [${f2(tb.declarerWonLo)}..${f2(tb.declarerWonHi)}]`;
	return ` | alone: thrown in ${f2(r.thrownIn)}, a declarer ${f2(tb.declaredShare)}, declarer won ${won}, declarer money ${m ? `${f2(m.mean)} [${f2(m.lo)}..${f2(m.hi)}] per declared hand (${m.n})` : '-'}, contracts ${JSON.stringify(r.contracts)}`;
}
// the cyclic line: deals and games, the paired interval with its half width, the old interval of the same games for comparison
export function cyclicText(r) {
	const h = (x) => (x === null || x === undefined ? '-' : f2(x));
	const iv = r.interval.share, sf = r.interval.safeShare;
	const main = r.safeT ? sf : iv, other = r.safeT ? iv : sf;
	let t = ` | cyclic ${r.deals} deals x ${r.turns} = ${r.hands} games, share ${f2(r.share)} [${h(r.lo)}..${h(r.hi)}] half ${h(main.half)}${r.safeT ? ' (safe-t)' : ''}`;
	t += `, ${r.safeT ? 'plain' : 'safe-t'} [${h(other.lo)}..${h(other.hi)}] half ${h(other.half)}, old way on the same games [${f2(r.old.share.lo)}..${f2(r.old.share.hi)}] half ${f2(r.old.share.half)}`;
	if (r.money) {
		t += `, money half ${h(r.money.half)} (old way ${f2(r.old.money.half)})`;
		if (r.moneyVsRest) t += `, a minus the others half ${h(r.moneyVsRest.half)} (old way ${f2(r.old.moneyVsRest.half)})`;
	}
	return t;
}
export function line(r, targets = {}) {
	const t = r.ms ? ` | think p50 ${r.ms.think?.p50 ?? '-'} p95 ${r.ms.think?.p95 ?? '-'} max ${r.ms.think?.max ?? '-'} ms` : '';
	if (r.alone) return `${r.game}:${r.seats} ${r.a} alone hands ${r.hands}${t}${r.errors ? ' ERRORS ' + r.errors : ''}${aloneText(r)}${verdict(r, targets)}`;
	return `${r.game}:${r.seats} ${r.a} vs ${r.b} hands ${r.hands} share ${f2(r.share)} [${f2(r.lo)}..${f2(r.hi)}] fair ${f2(r.fair)} margin ${r.margin} decisions ${r.decisions}${t}${r.errors ? ' ERRORS ' + r.errors : ''}${moneyText(r)}${r.mode === 'cyclic' ? cyclicText(r) : ''}${verdict(r, targets)}`;
}

// the number of deals of a cyclic run: --deals, or --budget-games divided by the turns of a deal
export function cyclicDeals(o, game) {
	const turns = turnsOf(game);
	if (o.budgetGames !== null) {
		if (!(o.budgetGames >= turns)) throw new SolverError(`--budget-games ${o.budgetGames} is less than the ${turns} games of one deal`);
		return Math.floor(o.budgetGames / turns);
	}
	return o.deals;
}

export async function runPair(pool, o, { id, seats }, a, b, alts = [], deals = o.deals) {
	if (o.mode === 'cyclic') {
		const game = gameOf(id, seats, alts);
		const D = cyclicDeals(o, game);
		const turns = turnsOf(game);
		const recs = await pool.run({ id, seats, alts, seed: o.seed, from: 0, to: D, mode: 'cyclic', a, b, timing: false, aJson: o.aJson ?? null, bJson: o.bJson ?? null, aBot: o.aBot ?? null });
		const bad = recs.find((r) => r.botError);
		if (bad) throw new SolverError(bad.error);
		const row = cyclicRowOf({ id, seats, alts, a: o.aLabel ?? a, b: o.bLabel ?? b, pairs: isPairGame(game), recs, turns, timing: false, safeT: o.safeT });
		return { row, recs };
	}
	const recs = await pool.run({ id, seats, alts, seed: o.seed, from: 0, to: deals, a, b, timing: o.timing, aJson: o.aJson ?? null, bJson: o.bJson ?? null, aBot: o.aBot ?? null });
	const bad = recs.find((r) => r.botError);
	if (bad) throw new SolverError(bad.error);
	const row = rowOf({ id, seats, alts, a: o.aLabel ?? a, b: o.bLabel ?? b, pairs: isPairGame(gameOf(id, seats)), recs, timing: o.timing });
	row.deals = deals;
	return { row, recs };
}

// alts that a single hand cannot show (the dealer and the first leader of a match are fixed here)
const SINGLE_HAND_BLIND = [/^seats\./, /first_leader$/];

async function altsRun(pool, o) {
	const rows = [];
	const table = [];
	for (const g of o.games) {
		const game = gameOf(g.id, g.seats);
		const alts = game.support.alts.filter((x) => x.supported && (!o.onlyAlt || x.path.includes(o.onlyAlt)));
		if (!alts.length) continue;
		const base = await runPair(pool, o, g, o.a, o.a);
		rows.push(base.row);
		for (const alt of alts) {
			if (SINGLE_HAND_BLIND.some((re) => re.test(alt.path))) { table.push({ game: g.id, seats: g.seats, path: alt.path, value: alt.value, alt: alt.alt, blind: true }); continue; }
			const x = await runPair(pool, o, g, o.a, o.a, [alt.path]);
			rows.push(x.row);
			const A = base.recs.filter((r) => !r.error), B = x.recs.filter((r) => !r.error);
			const col = (k) => ({ base: base.row[k], alt: x.row[k] });
			const zs = {
				dealer: zShares(x.row.dealerShare, B.length, base.row.dealerShare, A.length),
				leader: zShares(x.row.leaderShare, B.length, base.row.leaderShare, A.length),
				tie: zShares(x.row.tieShare, B.length, base.row.tieShare, A.length),
				margin: zMeans(B.map((r) => r.dealerMargin), A.map((r) => r.dealerMargin)),
			};
			table.push({ game: g.id, seats: g.seats, path: alt.path, value: alt.value, alt: alt.alt, dealerShare: col('dealerShare'), leaderShare: col('leaderShare'), dealerMargin: col('dealerMargin'), tieShare: col('tieShare'), z: zs, errors: x.row.errors + base.row.errors, differs: Object.entries(zs).filter(([, z]) => Math.abs(z) > 2.6).map(([k]) => k) });
			console.log(`${g.id}:${g.seats} ${alt.path}: dealer ${f2(base.row.dealerShare)} -> ${f2(x.row.dealerShare)}, leader ${f2(base.row.leaderShare)} -> ${f2(x.row.leaderShare)}, ties ${f2(base.row.tieShare)} -> ${f2(x.row.tieShare)}, dealer margin ${base.row.dealerMargin} -> ${x.row.dealerMargin}, z ${Object.values(zs).map((z) => z.toFixed(1)).join('/')}`);
		}
	}
	return { rows, table };
}

export async function main(argv) {
	const o = parseArgs(argv);
	if (o.mode !== 'unpaired' && o.mode !== 'cyclic') throw new SolverError(`--mode ${o.mode}: it is unpaired (the default) or cyclic`);
	if (o.mode === 'cyclic' && (o.alts || o.alone || o.timing)) throw new SolverError('--mode cyclic does not go with --alts, --alone or --timing');
	if (o.mode !== 'cyclic' && (o.budgetGames !== null || o.safeT)) throw new SolverError('--budget-games and --safe-t go with --mode cyclic only');
	if (o.budgetGames !== null && o.dealsGiven) throw new SolverError('give --deals or --budget-games, not both');
	if (o.aBot && (o.alts || o.alone)) throw new SolverError('--a-bot does not go with --alts or --alone');
	if ((o.aJson || o.bJson) && o.alts) throw new SolverError('--a-level and --b-level do not go with --alts');
	if (o.aBot) await loadBot(o.aBot);
	if (o.alone) { o.bJson = o.aJson; o.bLabel = o.aLabel; }
	if (o.timing) o.workers = 1;
	const pool = new Pool(o.workers);
	const t0 = Date.now();
	const meta = { seed: o.seed, workers: o.workers, timing: o.timing, at: new Date().toISOString(), ...(o.mode === 'cyclic' ? { mode: 'cyclic', safeT: o.safeT } : {}) };
	try {
		if (o.alts) {
			const { rows, table } = await altsRun(pool, o);
			const file = o.out ?? path.join(WORK, 'botlab', 'alts.json');
			fs.mkdirSync(path.dirname(file), { recursive: true });
			let prev = { rows: [], table: [] };
			if (o.append && fs.existsSync(file)) prev = JSON.parse(fs.readFileSync(file, 'utf8'));
			const gone = new Set(table.map((t) => t.game + ':' + t.seats));
			const keep = (t) => !gone.has(t.game + ':' + t.seats);
			fs.writeFileSync(file, JSON.stringify({ meta: { ...meta, level: o.a, deals: o.deals }, rows: [...prev.rows.filter((r) => !gone.has(r.game + ':' + r.seats)), ...rows], table: [...prev.table.filter(keep), ...table] }, null, 1));
			console.log('written', file, ((Date.now() - t0) / 1000).toFixed(0) + ' s');
			return;
		}
		const rows = [];
		const b = o.alone ? o.a : o.b;
		for (const g of o.games) {
			const { row } = await runPair(pool, o, g, o.a, b);
			if (o.alone) row.alone = true;
			rows.push(row);
			console.log(line(row, o.targets));
		}
		const safe = (t) => t.replace(/[^A-Za-z0-9._-]/g, '_');
		const file = o.out ?? path.join(WORK, 'botlab', o.alone ? `${safe(o.aLabel)}_alone${o.timing ? '_timing' : ''}.json` : `${safe(o.aLabel)}_vs_${safe(o.bLabel)}${o.mode === 'cyclic' ? '_cyclic' : ''}${o.timing ? '_timing' : ''}.json`);
		save(file, { ...meta, a: o.aLabel, b: o.alone ? o.aLabel : o.bLabel, alone: o.alone }, rows, o.append);
		console.log('written', file, ((Date.now() - t0) / 1000).toFixed(0) + ' s');
	} finally { await pool.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try { await main(process.argv.slice(2)); } catch (e) {
		if (!(e instanceof SolverError)) throw e;
		console.error('botlab: ' + e.message);
		process.exitCode = 1;
	}
}
