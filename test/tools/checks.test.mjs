// check-core-pure: on fake folders in the temp directory.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpDir, cleanup, run } from './helpers.mjs';

after(cleanup);

function fakeRepo(files) {
	const root = tmpDir();
	fs.mkdirSync(path.join(root, 'rulesets'), { recursive: true });
	fs.writeFileSync(path.join(root, 'rulesets', 'zorkgame_2.json'), JSON.stringify({ id: 'zorkgame_2', family: 'zorkfam' }));
	for (const [f, text] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
		fs.writeFileSync(path.join(root, f), text);
	}
	return root;
}
const pure = root => run('check-core-pure.mjs', ['--root', root]);

test('check-core-pure: no core yet is exit 0', () => {
	const r = pure(fakeRepo({}));
	assert.equal(r.code, 0);
	assert.match(r.out, /no core yet/);
});

test('check-core-pure: a clean core passes; words in comments for the API checks are ignored', () => {
	const root = fakeRepo({
		'core/a.js': '// the process of dealing, a Date is not used here\nexport const f = (x) => x + 1;\nexport const s = "process Date";\n',
		'bots/random.js': 'export function chooseAction(a, r) { return a[r.int(a.length)]; }\n',
	});
	const r = pure(root);
	assert.equal(r.code, 0, r.out);
});

test('check-core-pure: a game id or a family as a word fails; a longer word does not', () => {
	let r = pure(fakeRepo({ 'core/a.js': 'const g = "x"; // plays zorkgame_2 only\n' }));
	assert.equal(r.code, 1);
	assert.match(r.out, /FAIL core[\\/]a\.js/);
	assert.match(r.out, /zorkgame_2/);
	r = pure(fakeRepo({ 'bots/b.js': 'const fam = "zorkfam";\n' }));
	assert.equal(r.code, 1);
	assert.match(r.out, /zorkfam/);
	r = pure(fakeRepo({ 'core/c.js': 'const zorkfamily = 1;\n' }));
	assert.equal(r.code, 0, r.out);
});

test('check-core-pure: I/O imports, Date, Math.random, process fail', () => {
	const bad = {
		'core/fs.js': "import fs from 'node:fs';\n",
		'core/net.js': "import net from 'node:net';\n",
		'core/http.js': "import { get } from 'node:http';\n",
		'core/cp.js': "import { spawn } from 'node:child_process';\n",
		'core/plain.js': "import fs from 'fs';\n",
		'core/dyn.js': "const m = await import('node:fs');\n",
		'core/date.js': 'export const t = () => Date.now();\n',
		'core/rnd.js': 'export const r = () => Math.random();\n',
		'core/proc.js': 'export const e = () => process.env.X;\n',
	};
	const r = pure(fakeRepo(bad));
	assert.equal(r.code, 1);
	for (const f of Object.keys(bad)) assert.match(r.out, new RegExp('FAIL ' + f.replace('/', '[\\\\/]').replace('.', '\\.')), f);
});
