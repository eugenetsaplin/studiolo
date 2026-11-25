#!/usr/bin/env node
// "The five two-player games did not change": plays fixed hands of Sedici (sedici_2), Trent'uno at two (trentuno), Baronetti,
// Venticinque and Morto and writes a checksum of each hand, so two trees (the tag rules-r9 and a branch) can be compared.
//   node tools/same-five.mjs --out sums.json [--tree DIR] [--random 300] [--normal 20] [--matches 20] [--games a,b] [--ignore-revision]
//   node tools/same-five.mjs --compare a.json b.json
// --parallel plays each game in a process of its own (five at once) and joins the files; the checksums are the same.
// For every game: --random hands played by the random robot, --normal hands played by the bots of level normal, --matches whole
// matches played by the random robot. A hand's checksum is sha256 over what a table could see and what the core decided: the
// seat to act, the action, the views of both seats after every action, the result; a match's checksum adds the standing after
// every hand. Seeds are pinned (below), so the same tree always gives the same file. --tree names the tree to play (its core/,
// bots/ and rulesets/): the tool of one branch can play a temporary copy of an older tag. Exit code 1 when --compare finds a
// difference (the first differing hand of each game is named).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

export const GAMES = [['sedici_2', 2], ['trentuno', 2], ['baronetti', 2], ['venticinque', 2], ['morto', 2]];
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --ignore-revision: the number of the revision of the game file (the field `revision` of a view) is not summed, so a file whose
// number rose without a change of play gives the same checksums
let IGNORE_REVISION = false;
function canonical(v) {
	if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
	if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
	const keys = Object.keys(v).filter((k) => v[k] !== undefined && !(IGNORE_REVISION && k === 'revision')).sort();
	return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
const sha = () => crypto.createHash('sha256');

async function load(tree) {
	const imp = (p) => import(pathToFileURL(path.join(tree, p)).href);
	const core = await imp('core/index.js');
	const random = await imp('bots/random.js');
	const bots = await imp('bots/index.js');
	const level = JSON.parse(fs.readFileSync(path.join(tree, 'bots/levels/normal.json'), 'utf8'));
	const getFile = (id) => JSON.parse(fs.readFileSync(path.join(tree, 'rulesets', id + '.json'), 'utf8'));
	return { core, random, bots, level, getFile };
}

function arg(argv, name, dflt) {
	const i = argv.indexOf('--' + name);
	return i < 0 ? dflt : argv[i + 1];
}

// plays a hand to its end; `pick(h, toAct, step)` gives {seat, action}; every step goes into the hash
function playHandSum(h, pick, hash) {
	const view = (seat) => canonical(h.view(seat));
	hash.update('start|' + view(0) + '|' + view(1) + '\n');
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 6000) throw new Error('a hand does not end');
		const toAct = h.toAct();
		if (!toAct.length) throw new Error('nobody to act');
		const { seat, action } = pick(h, toAct, guard);
		const r = h.apply(seat, action);
		if (!r.ok) throw new Error('refused: ' + JSON.stringify(r));
		hash.update(seat + '|' + canonical(action) + '|' + view(0) + '|' + view(1) + '\n');
	}
	hash.update('result|' + canonical(h.result()) + '\n');
	return guard;
}

export async function run(opts) {
	const { tree, randomN, normalN, matchN, games } = opts;
	const L = await load(tree);
	const { core, random: rnd, bots, level, getFile } = L;
	const out = { tool: 'same-five', tree, random: randomN, normal: normalN, matches: matchN, games: {} };
	for (const [id, seats] of GAMES) {
		if (games && !games.includes(id)) continue;
		const game = core.loadGame(id, getFile, { seats });
		if (!game.support.runnable) throw new Error(id + ' is not runnable');
		const rec = { random: [], normal: [], matches: [] };
		const randomPick = (rng) => (h, toAct) => {
			const seat = toAct[rng.int(toAct.length)];
			return { seat, action: rnd.chooseAction(h.legal(seat), rng) };
		};
		for (let i = 0; i < randomN; i++) {
			const seed = `same5:${id}:r:${i}`;
			const h = core.newHand(game, { seed, dealer: i % seats });
			const hash = sha();
			playHandSum(h, randomPick(core.makeRng('pick:' + seed)), hash);
			rec.random.push(hash.digest('hex').slice(0, 24));
		}
		for (let i = 0; i < normalN; i++) {
			const seed = `same5:${id}:n:${i}`;
			const h = core.newHand(game, { seed, dealer: i % seats });
			const hash = sha();
			const pick = (hh, toAct, step) => {
				const seat = toAct[0];
				const a = bots.chooseAction({ game, view: hh.view(seat), level, seed: seed + ':' + step });
				return { seat, action: a.action };
			};
			playHandSum(h, pick, hash);
			rec.normal.push(hash.digest('hex').slice(0, 24));
		}
		for (let i = 0; i < matchN; i++) {
			const seed = `same5:${id}:m:${i}`;
			const m = core.newMatch(game, { seed, firstDealer: i % seats });
			const rng = core.makeRng('pick:' + seed);
			const hash = sha();
			for (let k = 0; k < 200; k++) {
				playHandSum(m.hand, randomPick(rng), hash);
				hash.update('standing|' + canonical(m.standing()) + '\n');
				if (m.isOver()) break;
				m.next();
			}
			hash.update('final|' + canonical(m.view(0).match) + '\n');
			rec.matches.push(hash.digest('hex').slice(0, 24));
		}
		out.games[id] = rec;
		console.log(`${id}: ${rec.random.length} random, ${rec.normal.length} normal, ${rec.matches.length} matches`);
	}
	return out;
}

// the first differing hand of each game and kind; returns the list of lines (empty = the same)
export function compare(a, b) {
	const lines = [];
	const letter = { random: 'r', normal: 'n', matches: 'm' };
	for (const id of new Set([...Object.keys(a.games), ...Object.keys(b.games)])) {
		const x = a.games[id], y = b.games[id];
		if (!x || !y) { lines.push(`${id}: only in one file`); continue; }
		for (const kind of ['random', 'normal', 'matches']) {
			if (x[kind].length !== y[kind].length) lines.push(`${id} ${kind}: ${x[kind].length} hands against ${y[kind].length}`);
			let bad = 0, first = -1;
			const n = Math.min(x[kind].length, y[kind].length);
			for (let i = 0; i < n; i++) if (x[kind][i] !== y[kind][i]) { bad++; if (first < 0) first = i; }
			if (bad) lines.push(`${id} ${kind}: ${bad} of ${n} differ; first: index ${first}, seed same5:${id}:${letter[kind]}:${first}`);
		}
	}
	return lines;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const argv = process.argv.slice(2);
	IGNORE_REVISION = argv.includes('--ignore-revision');
	if (argv[0] === '--compare') {
		const a = JSON.parse(fs.readFileSync(argv[1], 'utf8'));
		const b = JSON.parse(fs.readFileSync(argv[2], 'utf8'));
		const lines = compare(a, b);
		const total = (f) => Object.values(f.games).reduce((s, g) => s + g.random.length + g.normal.length + g.matches.length, 0);
		if (lines.length) { console.log('DIFFERENT\n' + lines.join('\n')); process.exit(1); }
		console.log(`SAME: ${total(a)} checksums of ${Object.keys(a.games).length} games`);
	} else {
		const tree = path.resolve(arg(argv, 'tree', HERE));
		const outFile = arg(argv, 'out', null);
		const gl = arg(argv, 'games', null);
		if (argv.includes('--parallel')) {
			if (!outFile) throw new Error('--parallel needs --out');
			const parts = await Promise.all(GAMES.map(([id]) => new Promise((res, rej) => {
				const part = path.resolve(outFile) + '.' + id + '.part';
				const args = [fileURLToPath(import.meta.url), '--tree', tree, '--games', id, '--out', part];
				if (IGNORE_REVISION) args.push('--ignore-revision');
				for (const k of ['random', 'normal', 'matches']) if (arg(argv, k, null) !== null) args.push('--' + k, arg(argv, k, null));
				const c = spawn(process.execPath, args, { stdio: 'inherit' });
				c.on('exit', (code) => (code === 0 ? res(part) : rej(new Error(id + ' exited ' + code))));
			})));
			const all = { tool: 'same-five', tree, games: {} };
			for (const part of parts) {
				const j = JSON.parse(fs.readFileSync(part, 'utf8'));
				Object.assign(all, { random: j.random, normal: j.normal, matches: j.matches });
				Object.assign(all.games, j.games);
				fs.rmSync(part);
			}
			fs.writeFileSync(outFile, JSON.stringify(all));
			console.log('written ' + outFile);
			process.exit(0);
		}
		const sums = await run({
			tree, randomN: +arg(argv, 'random', 300), normalN: +arg(argv, 'normal', 20), matchN: +arg(argv, 'matches', 20),
			games: gl ? gl.split(',') : null,
		});
		if (outFile) { fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(sums)); console.log('written ' + outFile); }
	}
}
