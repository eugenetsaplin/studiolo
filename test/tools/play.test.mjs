// tools/play.mjs: one hand or a summary of many; the same seed prints the same bytes; the --json record replays in the core.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, replayHand } from '../../core/index.js';
import { getFile } from '../../tools/botlab/play.mjs';
import { main, parseArgs } from '../../tools/play.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIRST = path.join(ROOT, 'test', 'botlab', 'fixtures', 'first-legal-bot.mjs');

async function run(args) {
	const lines = [];
	await main(args, (s) => lines.push(s));
	return lines.join('\n') + '\n';
}

test('one hand: deal, moves, result, money; the same twice, byte for byte', async () => {
	const args = ['sedici_2', '--seats', '2', '--seed', 'demo', '--bots', 'normal,easy'];
	const a = await run(args);
	assert.equal(await run(args), a);
	assert.match(a, /^game sedici_2, rules revision \d+, 2 seats\nseed demo, hand 0, hand seed demo:sedici_2:2:0, dealer seat 0\nseat 0: normal\nseat 1: easy\ndeal\n/);
	assert.match(a, /\nmoves\n\s+1  seat \d  play /);
	assert.match(a, /\n {4}trick won by seat|\n {8}trick won by seat/);
	assert.match(a, /\nresult\n  outcome: .*\n  winners: .*\n(  contract: .*\n)?  points: .*\n  payments: .*\n  money: seat 0 [-+]?\d+, seat 1 [-+]?\d+ \(sum 0\)\n  checksum [0-9a-f]{16}\n$/);
	// another seed, another hand
	assert.notEqual(await run(['sedici_2', '--seats', '2', '--seed', 'other', '--bots', 'normal,easy']), a);
});

test('a hand of a series is the same hand in both forms', async () => {
	const one = JSON.parse(await run(['venticinque', '--seats', '2', '--seed', 's', '--hand', '3', '--bots', 'random', '--json']));
	assert.equal(one.init.seed, 's:venticinque:2:3');
	assert.equal(one.init.dealer, 1);
});

test('--json: the record is replayed by replayHand to the same checksum (a game of cards only, a game with money, a variant, a solver bot)', async () => {
	const cases = [
		['venticinque', 2, null, 'easy,random'],
		['permesso_3', 3, null, 'easy'],
		['permesso_5', 5, null, 'easy,random,easy,random,easy'],
		['meno', 3, 'four_cards', 'random'],
		['sedici_2', 2, null, `bot:${FIRST},easy`],
		['chiamare_il_re', 4, null, 'random'],
	];
	for (const [id, seats, variant, bots] of cases) {
		for (const hand of [0, 1]) {
			const args = [id, '--seats', String(seats), '--seed', 'rp', '--hand', String(hand), '--bots', bots, '--json'];
			if (variant) args.push('--variant', variant);
			const out = await run(args);
			const rec = JSON.parse(out);
			assert.equal(out, JSON.stringify(rec) + '\n');
			assert.equal(rec.finished, true, id);
			const game = loadGame(id, getFile, { seats, variant });
			const again = replayHand(game, rec.init, rec.log);
			assert.equal(again.checksum(), rec.checksum, `${id} hand ${hand}`);
			assert.equal(again.isOver(), true);
			assert.deepEqual(again.result().winners, rec.winners);
			if (rec.money) assert.equal(rec.sum, 0, 'a zero-sum game: ' + id);
			assert.equal(await run(args), out);
		}
	}
});

test('--summary: shares add up to one, the same output with one worker or three', async () => {
	const base = ['meno', '--seats', '3', '--variant', 'four_cards', '--hands', '60', '--bots', 'random', '--summary'];
	const a = await run([...base, '--workers', '1']);
	assert.equal(await run([...base, '--workers', '3']), a);
	assert.match(a, /^game meno, 3 seats, variant four_cards, 60 hands, seed play, bots random,random,random\nthrown in /);
	const json = JSON.parse(await run([...base, '--workers', '2', '--json']));
	const total = Object.values(json.shares).reduce((s, x) => s + x.hands, 0);
	assert.equal(total, 60);
	for (const x of Object.values(json.shares)) assert.ok(x.lo <= x.share && x.share <= x.hi);
	assert.equal(json.money.length, 3);
	assert.ok(Math.abs(json.money.reduce((s, m) => s + m.mean, 0)) < 0.01, 'the money of a table adds up to zero');
	assert.match(a, /\nseveral winners +0\.\d{3} \[0\.\d{3}\.\.0\.\d{3}\]  \d+ of 60\n/);
});

test('--summary of a contract game counts the hands thrown in', async () => {
	const out = await run(['permesso_4', '--seats', '4', '--hands', '30', '--bots', 'random', '--summary', '--workers', '2']);
	assert.match(out, /\nthrown in +\d\.\d{3} /);
	assert.match(out, /\nmoney per hand \(received less paid\)/);
});

test('mistakes are said in one line', async () => {
	await assert.rejects(run(['--seats', '2']), /usage/);
	await assert.rejects(run(['sedici_2']), /--seats N is needed/);
	await assert.rejects(run(['sedici_2', '--seats', '2', '--bots', 'a,b,c']), /3 names for 2 seats/);
	await assert.rejects(run(['sedici_2', '--seats', '2', '--bots', 'nobody']), /not random, a level/);
	await assert.rejects(run(['sedici_2', '--seats', '9']), /game sedici_2, 9 seats/);
	await assert.rejects(run(['meno', '--seats', '3', '--variant', 'nope']), /variant nope/);
	await assert.rejects(run(['nogame', '--seats', '2']), /no game file rulesets\/nogame\.json/);
	await assert.rejects(run(['sedici_2', '--seats', '2', '--frob']), /unknown option --frob/);
	assert.throws(() => parseArgs(['sedici_2', '--seats', '2', '--summary', '--hand', '2']), /--hand is for one hand/);
});

test('a wrong solver bot stops a hand with its number and seed', async () => {
	const bad = path.join(ROOT, 'test', 'botlab', 'fixtures', 'illegal-bot.mjs');
	await assert.rejects(run(['venticinque', '--seats', '2', '--seed', 'bb', '--hand', '2', '--bots', `bot:${bad},random`]), /hand 2 \(seed bb:venticinque:2:2\), seat 0, decision \d+: the action .* is not in view\.legal/);
});

test('the tools name no game of the book in their code', () => {
	const ids = fs.readdirSync(path.join(ROOT, 'rulesets')).filter((n) => n.endsWith('.json')).map((n) => n.slice(0, -5));
	const files = ['tools/play.mjs', 'tools/botlab/table.mjs', 'tools/botlab/table-worker.mjs', 'tools/botlab/solver.mjs'];
	for (const f of files) {
		const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
		for (const id of ids) assert.doesNotMatch(text, new RegExp(`\\b${id}\\b`, 'i'), `${f} names ${id}`);
	}
});
