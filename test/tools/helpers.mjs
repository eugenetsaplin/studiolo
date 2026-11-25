// Helpers of the tool tests: temporary copies of the repository parts; the real rulesets/ is never written.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseRevisions, gameFilesOf } from '../../tools/validate-rulesets.mjs';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TOOLS = path.join(REPO, 'tools');

const made = [];
export function tmpDir(prefix = 'studiolo-test-') {
	const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
	made.push(d);
	return d;
}
export function cleanup() {
	for (const d of made.splice(0)) fs.rmSync(d, { recursive: true, force: true });
}

// A copy of rulesets/ (game files, texts, schema, REVISIONS.md, OPEN_QUESTIONS.md) in a new root folder.
export function copyRulesets() {
	const root = tmpDir();
	fs.cpSync(path.join(REPO, 'rulesets'), path.join(root, 'rulesets'), { recursive: true });
	return root;
}

export function run(script, args = [], opts = {}) {
	const r = spawnSync(process.execPath, [path.join(TOOLS, script), ...args], { encoding: 'utf8', cwd: opts.cwd ?? REPO, timeout: 60000 });
	return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
export const validate = (root, ...more) => run('validate-rulesets.mjs', ['--root', root, ...more]);

export const gameFile = (root, name) => path.join(root, 'rulesets', name + '.json');
export const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
export function mutate(file, fn) {
	const data = readJson(file);
	fn(data);
	fs.writeFileSync(file, JSON.stringify(data, null, '\t') + '\n');
}

// The first rule leaf (an object with value and source) for which pick() is true: [path, node].
export function findLeaf(node, pick, p = '$') {
	if (Array.isArray(node)) {
		for (let i = 0; i < node.length; i++) { const r = findLeaf(node[i], pick, `${p}[${i}]`); if (r) return r; }
		return null;
	}
	if (!node || typeof node !== 'object') return null;
	if ('value' in node && typeof node.source === 'string' && pick(node)) return [p, node];
	for (const [k, v] of Object.entries(node)) { const r = findLeaf(v, pick, `${p}.${k}`); if (r) return r; }
	return null;
}
export const mark = node => /^\[(D|R|S)\]/u.exec(node.source)?.[1];

// The number of the last revision block of REVISIONS.md in a repository (default: the real one). A copy's next revision is this + 1.
export function lastRevision(root = REPO) {
	const { blocks } = parseRevisions(fs.readFileSync(path.join(root, 'rulesets', 'REVISIONS.md'), 'utf8').replace(/\r\n/g, '\n'));
	return blocks[blocks.length - 1].n;
}

// Removes every "replace" from the game files of a copy (the hashes of REVISIONS.md no longer match: use it where G6 does not matter).
export function stripReplace(root) {
	const dir = path.join(root, 'rulesets');
	const walk = n => {
		if (Array.isArray(n)) n.forEach(walk);
		else if (n && typeof n === 'object') { delete n.replace; Object.values(n).forEach(walk); }
	};
	for (const f of gameFilesOf(dir)) {
		const file = path.join(dir, f);
		const data = readJson(file);
		walk(data);
		fs.writeFileSync(file, JSON.stringify(data, null, '\t') + '\n');
	}
}
