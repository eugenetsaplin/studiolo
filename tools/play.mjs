#!/usr/bin/env node
// Play a hand of any game of the core, or many hands, with bots at the seats. Nothing but the seed decides the cards and
// the bots' choices: the same arguments print the same bytes.
//
//   node tools/play.mjs <game> --seats N [--variant V] [--seed S] [--bots a,b,...] [--hand H] [--dealer D] [--json]
//        One hand: the deal, every move (seat, action), the result and the money. --json prints the record of the hand
//        instead: {init: {seed, dealer}, log, ...}. replayHand(game, record.init, record.log) plays it again (docs/CORE_API.md).
//   node tools/play.mjs <game> --seats N [--variant V] [--seed S] [--bots a,b,...] --hands K --summary [--workers W] [--json]
//        K hands (numbers 0..K-1, dealer = hand number mod seats): the shares of hands thrown in, without a winner, with one
//        winner and with several winners (95 % Wilson intervals), and the mean money of every seat per hand.
//
// <game>: the id of a file in rulesets/. --bots: one name for every seat, or one per seat; a name is random, a level of
// bots/levels/, a level file (<file>.json) or bot:<module.mjs> (a solver's bot, see tools/botlab.mjs --a-bot).
// Hand H of a series has the seed <S>:<game>:<seats>[:<variant>]:<H>, the same in both forms.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newHand } from '../core/index.js';
import { Pool } from './botlab/pool.mjs';
import { wilson, mean, sd } from './botlab/stats.mjs';
import { SolverError } from './botlab/solver.mjs';
import { resolvePlayers, playTable, moneyBySeat, tableGame } from './botlab/table.mjs';

const FLAGS = new Set(['--json', '--summary']);
const VALUES = new Set(['--seats', '--variant', '--seed', '--bots', '--hands', '--hand', '--dealer', '--workers']);

export function parseArgs(argv) {
	const o = { game: null, json: false, summary: false };
	const kv = {};
	for (let i = 0; i < argv.length; i++) {
		const t = argv[i];
		if (FLAGS.has(t)) o[t.slice(2)] = true;
		else if (VALUES.has(t)) {
			if (argv[i + 1] === undefined) throw new SolverError(`${t} needs a value`);
			kv[t.slice(2)] = argv[++i];
		} else if (t.startsWith('--')) throw new SolverError(`unknown option ${t}`);
		else if (o.game === null) o.game = t;
		else throw new SolverError(`unexpected argument ${t}`);
	}
	if (!o.game) throw new SolverError('usage: node tools/play.mjs <game> --seats N [--variant V] [--seed S] [--bots a,b] [--hand H] [--json] | --hands K --summary');
	const num = (k, d, min) => {
		if (kv[k] === undefined) return d;
		const x = Number(kv[k]);
		if (!Number.isInteger(x) || x < min) throw new SolverError(`--${k} must be an integer >= ${min}`);
		return x;
	};
	o.seats = num('seats', null, 1);
	if (o.seats === null) throw new SolverError('--seats N is needed');
	o.variant = kv.variant ?? null;
	o.seed = kv.seed ?? 'play';
	o.hand = num('hand', 0, 0);
	o.dealer = num('dealer', null, 0);
	o.hands = num('hands', 100, 1);
	o.workers = num('workers', Math.max(1, Math.min(4, os.availableParallelism() - 2)), 1);
	if (o.summary && kv.hand !== undefined) throw new SolverError('--hand is for one hand; --summary plays hands 0..K-1');
	if (o.dealer !== null && o.dealer >= o.seats) throw new SolverError('--dealer must be a seat number');
	let bots = (kv.bots ?? 'normal').split(',').map((s) => s.trim()).filter(Boolean);
	if (bots.length === 1) bots = new Array(o.seats).fill(bots[0]);
	if (bots.length !== o.seats) throw new SolverError(`--bots: ${bots.length} names for ${o.seats} seats (give one name or one per seat)`);
	o.bots = bots;
	return o;
}

const fmtAction = (a) => [a.type, a.card, ...Object.keys(a).filter((k) => k !== 'type' && k !== 'card').sort().map((k) => `${k}=${JSON.stringify(a[k])}`)].filter((x) => x !== undefined).join(' ');
const signed = (x) => (x > 0 ? '+' + x : String(x));
const f3 = (x) => x.toFixed(3);
const round3 = (x) => Math.round(x * 1000) / 1000;

function fmtEvent(e) {
	if (e.e === 'card_played' || e.e === 'counted' || e.e === 'result' || e.e === 'paid') return null;
	if (e.e === 'trick_won') return `trick won by seat ${e.seat} (${e.cards.join(' ')})`;
	const { e: name, ...rest } = e;
	return `${name} ${JSON.stringify(rest)}`;
}

function oneHand(o, players, out) {
	const t = playTable({ id: o.game, seats: o.seats, variant: o.variant, seed: o.seed, h: o.hand, dealer: o.dealer ?? undefined }, players);
	const res = t.finished ? t.hand.result() : null;
	const money = res ? moneyBySeat(res, o.seats) : null;
	if (o.json) {
		out(JSON.stringify({
			game: o.game, revision: t.game.revision, seats: o.seats, variant: o.variant, seed: o.seed, hand: o.hand,
			init: { seed: t.handSeed, dealer: t.dealer }, bots: players.map((p) => p.label),
			log: t.hand.log, finished: t.finished, outcome: res?.outcome ?? null, winners: res?.winners ?? null,
			payments: res?.payments ?? null, money, sum: money ? money.reduce((a, b) => a + b, 0) : null, checksum: t.hand.checksum(),
		}));
		return;
	}
	// the cards as dealt: a new hand of the same seed, before any action
	const deal = newHand(t.game, { seed: t.handSeed, dealer: t.dealer }).snapshot();
	out(`game ${o.game}, rules revision ${t.game.revision}, ${o.seats} seats${o.variant ? ', variant ' + o.variant : ''}`);
	out(`seed ${o.seed}, hand ${o.hand}, hand seed ${t.handSeed}, dealer seat ${t.dealer}`);
	players.forEach((p, i) => out(`seat ${i}: ${p.label}`));
	out('deal');
	for (const [s, cards] of Object.entries(deal.hands)) out(`  seat ${s}: ${cards.join(' ')}`);
	if (deal.rest.length) out(`  undealt: ${deal.rest.length} cards`);
	out('moves');
	t.steps.forEach((st, i) => {
		out(`${String(i + 1).padStart(4)}  seat ${st.seat}  ${fmtAction(st.action)}`);
		for (const e of st.events) { const txt = fmtEvent(e); if (txt) out(`        ${txt}`); }
	});
	out('result');
	if (!res) { out('  the hand did not end within 6000 moves'); return; }
	out(`  outcome: ${res.outcome}${res.reason ? ' (' + res.reason + ')' : ''}`);
	out(`  winners: ${res.winners.length ? res.winners.map((s) => 'seat ' + s).join(', ') : 'none'}`);
	if (res.contract !== undefined) out(`  contract: ${res.contract}, declarer ${res.declarer === null || res.declarer === undefined ? 'none' : 'seat ' + res.declarer}`);
	out(`  points: ${Object.entries(res.sidePoints ?? {}).map(([s, v]) => `side ${s} ${v}`).join(', ')}`);
	if (money) {
		out(`  payments: ${(res.payments ?? []).map((p) => `seat ${p.from} to seat ${p.to} ${p.amount} (${p.why})`).join('; ') || 'none'}`);
		out(`  money: ${money.map((m, s) => `seat ${s} ${signed(m)}`).join(', ')} (sum ${money.reduce((a, b) => a + b, 0)})`);
	} else out('  money: none in this game');
	out(`  checksum ${t.hand.checksum()}`);
}

async function summary(o, out) {
	const pool = new Pool(o.workers, new URL('./botlab/table-worker.mjs', import.meta.url));
	let recs;
	try { recs = await pool.run({ id: o.game, seats: o.seats, variant: o.variant, seed: o.seed, bots: o.bots, from: 0, to: o.hands }); } finally { await pool.close(); }
	const fatal = recs.find((r) => r.fatal);
	if (fatal) throw new SolverError(fatal.error);
	const n = recs.length;
	const count = (f) => recs.filter(f).length;
	const kinds = [
		['thrown in', count((r) => r.finished && r.outcome === 'thrown_in')],
		['no winner', count((r) => r.finished && r.outcome !== 'thrown_in' && r.winners === 0)],
		['one winner', count((r) => r.finished && r.outcome !== 'thrown_in' && r.winners === 1)],
		['several winners', count((r) => r.finished && r.outcome !== 'thrown_in' && r.winners > 1)],
		['not finished', count((r) => !r.finished)],
	];
	const shares = Object.fromEntries(kinds.map(([k, c]) => { const p = c / n; const w = wilson(p, n); return [k, { hands: c, share: round3(p), lo: round3(w.lo), hi: round3(w.hi) }]; }));
	const withMoney = recs.filter((r) => r.money);
	const money = withMoney.length
		? Array.from({ length: o.seats }, (_, s) => { const xs = withMoney.map((r) => r.money[s]); const m = mean(xs); const se = sd(xs) / Math.sqrt(xs.length); return { seat: s, mean: round3(m), lo: round3(m - 1.96 * se), hi: round3(m + 1.96 * se) }; })
		: null;
	if (o.json) { out(JSON.stringify({ game: o.game, seats: o.seats, variant: o.variant, seed: o.seed, hands: n, bots: o.bots, shares, money })); return; }
	out(`game ${o.game}, ${o.seats} seats${o.variant ? ', variant ' + o.variant : ''}, ${n} hands, seed ${o.seed}, bots ${o.bots.join(',')}`);
	for (const [k] of kinds) { const s = shares[k]; out(`${k.padEnd(16)}${f3(s.share)} [${f3(s.lo)}..${f3(s.hi)}]  ${s.hands} of ${n}`); }
	if (money) { out('money per hand (received less paid), mean and 95 % interval:'); for (const m of money) out(`  seat ${m.seat}  ${signed(m.mean)} [${f3(m.lo)}..${f3(m.hi)}]`); } else out('money: none in this game');
}

export async function main(argv, out = (s) => process.stdout.write(s + '\n')) {
	const o = parseArgs(argv);
	if (!fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'rulesets', o.game + '.json'))) throw new SolverError(`no game file rulesets/${o.game}.json`);
	tableGame(o.game, o.seats, o.variant); // a bad seat count or variant stops here with the core's message
	if (o.summary) { await resolvePlayers(o.bots); await summary(o, out); } else oneHand(o, await resolvePlayers(o.bots), out);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try { await main(process.argv.slice(2)); } catch (e) {
		if (!(e instanceof SolverError)) throw e;
		console.error('play: ' + e.message);
		process.exitCode = 1;
	}
}
