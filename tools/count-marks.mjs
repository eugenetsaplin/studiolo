#!/usr/bin/env node
// Counts the marks [D] / [R] / [S] of the rule leaves in rulesets/*.json, by file and in all.
//   node tools/count-marks.mjs [--root <repo dir>] [--ref <git revision>] [--list]
// --ref counts the files as they stand at a git revision (for example rules-r7) instead of the working tree.
// --list prints every counted leaf with its mark.
//
// The rule of the count (REVISIONS.md, revision 8): a leaf is an object with `value` and `source`
// outside `left_out`; leaves marked `"unused": true` are not counted; leaves inside `variants` are
// counted; a leaf a child file inherits through `extends` is counted once, in the file that writes it
// (each file is read as it is written, without its parent). Objects with a `source` but no `value`
// (phases, penalties, payments whose sum lies in `amount`, bot advice) are not counted.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MARK = /^\[(D|R|S)\] /;

export function* countedLeaves(node, p = '$') {
	if (Array.isArray(node)) {
		for (let i = 0; i < node.length; i++) yield* countedLeaves(node[i], `${p}[${i}]`);
		return;
	}
	if (!node || typeof node !== 'object') return;
	if (typeof node.source === 'string' && 'value' in node && node.unused !== true) {
		const m = MARK.exec(node.source);
		yield { path: p, mark: m ? m[1] : '?' };
	}
	for (const [k, v] of Object.entries(node)) {
		if (k === 'source') continue;
		if (p === '$' && k === 'left_out') continue;
		yield* countedLeaves(v, `${p}.${k}`);
	}
}

export function countGame(game) {
	const c = { D: 0, R: 0, S: 0, '?': 0, leaves: [] };
	for (const leaf of countedLeaves(game)) { c[leaf.mark]++; c.leaves.push(leaf); }
	return c;
}

function readFiles(root, ref) {
	const rel = 'rulesets';
	if (!ref) {
		const dir = path.join(root, rel);
		return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
			.map(f => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
	}
	const names = execFileSync('git', ['-C', root, 'ls-tree', '--name-only', `${ref}:${rel}`], { encoding: 'utf8' })
		.split('\n').filter(f => f.endsWith('.json')).sort();
	return names.map(f => [f, execFileSync('git', ['-C', root, 'show', `${ref}:${rel}/${f}`], { encoding: 'utf8', maxBuffer: 1 << 26 })]);
}

export function countAll(root, ref) {
	const rows = [];
	const total = { D: 0, R: 0, S: 0, '?': 0 };
	for (const [f, text] of readFiles(root, ref)) {
		const c = countGame(JSON.parse(text));
		rows.push([f.replace(/\.json$/, ''), c]);
		for (const k of ['D', 'R', 'S', '?']) total[k] += c[k];
	}
	return { rows, total };
}

function main(argv) {
	const here = path.dirname(fileURLToPath(import.meta.url));
	let root = path.resolve(here, '..');
	let ref = null;
	let list = false;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--root') root = path.resolve(argv[++i]);
		else if (argv[i] === '--ref') ref = argv[++i];
		else if (argv[i] === '--list') list = true;
		else { console.error(`unknown argument: ${argv[i]}`); process.exit(2); }
	}
	const { rows, total } = countAll(root, ref);
	const pad = (s, n) => String(s).padStart(n);
	console.log(`Marks of the rule leaves${ref ? ` at ${ref}` : ''}:`);
	console.log('file                    [D]  [R]  [S]  all');
	for (const [id, c] of rows) {
		console.log(`${id.padEnd(22)} ${pad(c.D, 4)} ${pad(c.R, 4)} ${pad(c.S, 4)} ${pad(c.D + c.R + c.S + c['?'], 4)}${c['?'] ? `  (${c['?']} without a mark)` : ''}`);
		if (list) for (const l of c.leaves) console.log(`    [${l.mark}] ${l.path}`);
	}
	const all = total.D + total.R + total.S + total['?'];
	console.log(`${'total'.padEnd(22)} ${pad(total.D, 4)} ${pad(total.R, 4)} ${pad(total.S, 4)} ${pad(all, 4)}${total['?'] ? `  (${total['?']} without a mark)` : ''}`);
	if (total['?']) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
