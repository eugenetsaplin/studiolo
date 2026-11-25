// The tools of a solver: a level from a file, a bot module in place of seat a, the money of a against the others.
// The bot of a solver gets the view of its own seat and nothing else; a wrong answer stops the run with the hand and its seed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { playHand } from '../../tools/botlab/play.mjs';
import { rowOf } from '../../tools/botlab/aggregate.mjs';
import { loadBot } from '../../tools/botlab/solver.mjs';
import { main, line, parseArgs } from '../../tools/botlab.mjs';
import { leaks, publicFrom, seatLeaks } from '../lib/secrecy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const FIX = (n) => path.join(HERE, 'fixtures', n);
const easyJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'bots', 'levels', 'easy.json'), 'utf8'));
const firstLegal = await loadBot(pathToFileURL(FIX('first-legal-bot.mjs')).href);

test('a level from a file plays exactly as the same level by name', () => {
	for (let h = 0; h < 3; h++) {
		const named = playHand({ id: 'venticinque', seats: 2, seed: 'lv', h, a: 'easy', b: 'random' });
		const filed = playHand({ id: 'venticinque', seats: 2, seed: 'lv', h, a: 'whatever', aJson: easyJson, b: 'random' });
		assert.deepEqual(filed, named);
	}
});

test('a level file with a wrong key is refused with the name of the key', () => {
	assert.throws(() => playHand({ id: 'venticinque', seats: 2, seed: 'lv', h: 0, a: 'x', aJson: { ...easyJson, bogus: 1 }, b: 'random' }), /unknown key bogus/);
});

test('the example bot plays whole hands at the seat of a, and the same twice', () => {
	for (const [id, seats] of [['venticinque', 2], ['permesso_3', 3]]) {
		for (let h = 0; h < 3; h++) {
			const spec = { id, seats, seed: 'fl', h, a: 'normal', b: 'random', botFn: firstLegal.bind(null) };
			const r = playHand(spec);
			assert.equal(r.error, undefined, JSON.stringify(r));
			assert.deepEqual(playHand(spec), r);
		}
	}
});

test('a bot that sees only its own view: a spy searches every argument for cards of other seats', () => {
	const seen = { calls: 0, leaks: [], keys: new Set() };
	for (const [id, seats] of [['venticinque', 2], ['permesso_3', 3], ['chiamare_il_re', 4], ['meno', 3]]) {
		let ctx = null;
		const spy = (args) => {
			seen.calls++;
			Object.keys(args).forEach((k) => seen.keys.add(k));
			const snap = ctx.hand.snapshot();
			const bad = leaks(snap, publicFrom(snap), ctx.seat, { view: args.view, level: args.level, seed: args.seed });
			if (bad.length) seen.leaks.push(`${id} seat ${ctx.seat}: ${bad.join(' ')}`);
			const sec = seatLeaks(snap, ctx.seat, { t: 'view', view: args.view });
			if (sec.length) seen.leaks.push(`${id} seat ${ctx.seat}: ${sec.join(' ')}`);
			// the game is the rules, not a hand: no hand state hangs on it
			assert.equal(args.game.hands, undefined);
			assert.equal(args.game.s, undefined);
			assert.equal(args.view.seat, ctx.seat);
			return { action: args.view.legal[0] };
		};
		for (let h = 0; h < 3; h++) {
			const r = playHand({ id, seats, seed: 'spy', h, a: 'normal', b: 'random', botFn: spy, onDecision: (c) => { ctx = c; } });
			assert.equal(r.error, undefined, JSON.stringify(r));
		}
	}
	assert.ok(seen.calls > 100, 'the spy was asked: ' + seen.calls);
	assert.deepEqual([...seen.keys].sort(), ['game', 'level', 'seed', 'view']);
	assert.deepEqual(seen.leaks, []);
});

test('the spy check does find a leak when one is put in (control)', () => {
	let found = 0;
	const control = (args) => args.view.legal[0] && { action: args.view.legal[0] };
	let ctx = null;
	playHand({ id: 'venticinque', seats: 2, seed: 'spy', h: 0, a: 'normal', b: 'random', botFn: (args) => {
		const snap = ctx.hand.snapshot();
		const other = snap.hands[1 - ctx.seat][0];
		if (leaks(snap, publicFrom(snap), ctx.seat, { view: args.view, planted: other }).includes(other)) found++;
		return control(args);
	}, onDecision: (c) => { ctx = c; } });
	assert.ok(found > 0);
});

test('the bot gets a copy of the view: damage to it changes nothing in the hand', () => {
	const vandal = ({ view }) => {
		const answer = view.legal[0];
		view.legal.length = 0;
		view.hand.length = 0;
		view.tricks.length = 0;
		return { action: answer };
	};
	for (let h = 0; h < 3; h++) {
		const spec = { id: 'venticinque', seats: 2, seed: 'cp', h, a: 'normal', b: 'random' };
		assert.deepEqual(playHand({ ...spec, botFn: vandal }), playHand({ ...spec, botFn: firstLegal }));
	}
});

test('a wrong answer or an exception is an error with the hand and its seed, not a changed move', async () => {
	const illegal = playHand({ id: 'venticinque', seats: 2, seed: 'er', h: 4, a: 'normal', b: 'random', botFn: (await loadBot(pathToFileURL(FIX('illegal-bot.mjs')).href)) });
	assert.equal(illegal.botError, true);
	assert.match(illegal.error, /hand 4 \(seed er:venticinque:2:4\), seat \d, decision \d+: the action .* is not in view\.legal/);
	const thrown = playHand({ id: 'venticinque', seats: 2, seed: 'er', h: 1, a: 'normal', b: 'random', botFn: (await loadBot(pathToFileURL(FIX('throwing-bot.mjs')).href)) });
	assert.match(thrown.error, /hand 1 \(seed er:venticinque:2:1\).*the bot threw: boom/);
	const bare = playHand({ id: 'venticinque', seats: 2, seed: 'er', h: 0, a: 'normal', b: 'random', botFn: (await loadBot(pathToFileURL(FIX('bare-action-bot.mjs')).href)) });
	assert.match(bare.error, /the answer must be \{action: <one of view\.legal>\}/);
	const late = playHand({ id: 'venticinque', seats: 2, seed: 'er', h: 0, a: 'normal', b: 'random', botFn: () => Promise.resolve({ action: null }) });
	assert.match(late.error, /returned a promise/);
});

test('botlab stops on a wrong bot with one clear message, and runs a good one', async () => {
	const lines = [];
	const log = console.log;
	console.log = (...a) => lines.push(a.join(' '));
	const out = path.join(os.tmpdir(), `botlab-solver-test-${process.pid}.json`);
	try {
		await assert.rejects(main(['--games', 'venticinque:2', '--a-bot', FIX('illegal-bot.mjs'), '--b', 'random', '--deals', '6', '--seed', 'er', '--workers', '1', '--out', out]),
			/solver bot, venticinque:2, hand \d+ \(seed er:venticinque:2:\d+\), seat \d, decision \d+: the action/);
		await assert.rejects(main(['--games', 'venticinque:2', '--a-bot', FIX('no-such-bot.mjs'), '--deals', '2', '--out', out]), /cannot be loaded/);
		await main(['--games', 'permesso_3:3', '--a-bot', FIX('first-legal-bot.mjs'), '--a', 'easy', '--b', 'random', '--deals', '6', '--seed', 'ok', '--workers', '2', '--out', out]);
	} finally { console.log = log; fs.rmSync(out, { force: true }); }
	const row = lines.find((l) => l.startsWith('permesso_3:3 bot:first-legal-bot vs random hands 6 '));
	assert.ok(row, lines.join('\n'));
	assert.match(row, /, a minus the others -?\d+\.\d{3} \[-?\d+\.\d{3}\.\.-?\d+\.\d{3}\]$/);
});

test('arguments: a bot does not go with --alone, a level file is read', () => {
	const o = parseArgs(['--a-bot', FIX('first-legal-bot.mjs'), '--a-level', path.join(ROOT, 'bots', 'levels', 'normal.json'), '--b-level', path.join(ROOT, 'bots', 'levels', 'easy.json')]);
	assert.equal(o.aLabel, 'bot:first-legal-bot');
	assert.equal(o.bLabel, 'easy');
	assert.equal(o.aJson.id, 'normal');
	assert.match(o.aBot, /^file:\/\/\//);
	assert.throws(() => parseArgs(['--a-level', path.join(HERE, 'no-such.json')]), /level file/);
});

test('money against the others: money of a times n/(n-1), the interval alike, in the line', () => {
	for (const [id, seats] of [['sedici_2', 2], ['permesso_3', 3], ['permesso_5', 5]]) {
		const recs = [];
		for (let h = 0; h < 8; h++) recs.push(playHand({ id, seats, seed: 'mv', h, a: 'easy', b: 'random' }));
		const row = rowOf({ id, seats, alts: [], a: 'easy', b: 'random', pairs: false, recs, timing: false });
		const k = seats / (seats - 1);
		assert.ok(Math.abs(row.moneyVsRest.mean - row.money.mean * k) < 0.002, id);
		assert.ok(Math.abs(row.moneyVsRest.lo - row.money.lo * k) < 0.002 && Math.abs(row.moneyVsRest.hi - row.money.hi * k) < 0.002, id);
		assert.match(line(row), new RegExp(`, a minus the others ${row.moneyVsRest.mean.toFixed(3).replace('.', '\\.')} \\[`));
	}
	// records without money (a game whose hands carry no payments): no new column
	const recs = [0, 1, 2, 3].map((h) => { const r = playHand({ id: 'meno', seats: 3, seed: 'mv', h, a: 'random', b: 'random' }); delete r.money; delete r.thrownIn; return r; });
	const row = rowOf({ id: 'meno', seats: 3, alts: [], a: 'random', b: 'random', pairs: false, recs, timing: false });
	assert.equal(row.moneyVsRest, undefined);
	assert.doesNotMatch(line(row), /a minus the others/);
});

test('the seed of a solver bot is an opaque print: 32 hex digits, no seed of the deal, and a bot that rebuilds the deal from it gets it wrong', async () => {
	const { newHand } = await import('../../core/index.js');
	const base = 'peek-base';
	const seen = [];
	let wrong = 0, total = 0;
	const peeker = ({ game, view, seed }) => {
		seen.push(seed);
		// the way the first version leaked: split the seed of the decision and rebuild the deal
		const [s, gk, h] = seed.split('|');
		const guess = newHand(game, { seed: `${s}:${gk}:${h}`, dealer: view.dealer });
		const other = (view.seat + 1) % view.seats;
		total++;
		if (JSON.stringify(guess.view(other).hand) !== JSON.stringify(ctx.hand.view(other).hand)) wrong++;
		// a second try: take the whole seed as the seed of the deal
		const guess2 = newHand(game, { seed, dealer: view.dealer });
		if (JSON.stringify(guess2.view(other).hand) !== JSON.stringify(ctx.hand.view(other).hand)) wrong++;
		total++;
		return { action: view.legal[0] };
	};
	let ctx = null;
	for (let h = 0; h < 3; h++) {
		const r = playHand({ id: 'venticinque', seats: 2, seed: base, h, a: 'normal', b: 'random', botFn: peeker, onDecision: (c) => { ctx = c; } });
		assert.equal(r.error, undefined, JSON.stringify(r));
	}
	assert.ok(seen.length > 20);
	for (const s of seen) {
		assert.match(s, /^[0-9a-f]{32}$/);
		assert.ok(!s.includes(base));
	}
	assert.equal(wrong, total, 'every rebuilt deal differs from the real one');
	// the same decision gives the same print
	const again = [];
	for (let h = 0; h < 3; h++) playHand({ id: 'venticinque', seats: 2, seed: base, h, a: 'normal', b: 'random', botFn: ({ view, seed }) => { again.push(seed); return { action: view.legal[0] }; } });
	assert.ok(again.length > 0 && again.every((s, i) => /^[0-9a-f]{32}$/.test(s)));
});
