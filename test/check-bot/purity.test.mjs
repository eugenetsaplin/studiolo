// Bot check: purity and the level files. bots/ passes tools/check-core-pure.mjs (its own lines: the web lines are
// checked elsewhere), holds no clock, no process, no Math.random; the three level files parse; parseLevel refuses.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseLevel, chooseAction, BOT_ID } from '../../bots/index.js';
import { stripCode } from '../../tools/check-core-pure.mjs';
import { ROOT, levelJson, game, positions } from './lib.mjs';

const BOT_FILES = fs.readdirSync(path.join(ROOT, 'bots')).filter((f) => f.endsWith('.js'));

test('tools/check-core-pure.mjs: every bots/ file is ok', () => {
	const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'check-core-pure.mjs')], { encoding: 'utf8', timeout: 120000 });
	const lines = (r.stdout + r.stderr).split(/\r?\n/).filter((l) => /bots[\\/]/.test(l));
	for (const f of BOT_FILES) {
		const line = lines.find((l) => l.replace(/\\/g, '/').endsWith('bots/' + f));
		assert.ok(line, 'check-core-pure did not check bots/' + f);
		assert.match(line, /^ok\b/, line);
	}
});

test('no Date, process, Math.random, performance, crypto, globalThis, setTimeout in bots/ code', () => {
	for (const f of BOT_FILES) {
		const code = stripCode(fs.readFileSync(path.join(ROOT, 'bots', f), 'utf8'));
		for (const w of ['Date', 'process', 'Math.random', 'performance', 'crypto', 'globalThis', 'setTimeout', 'setInterval', 'require', 'import(']) {
			assert.ok(!code.includes(w), `bots/${f} uses ${w}`);
		}
		for (const m of code.matchAll(/from\s+'([^']+)'/g)) assert.ok(m[1].startsWith('.'), `bots/${f} imports ${m[1]}`);
	}
});

test('the three level files parse; ids match file names; contract §6 key set, nothing else', () => {
	const keys = ['format', 'id', 'name', 'worlds', 'budget_plays', 'halving', 'rollout', 'noise', 'temperature', 'forget', 'win_weight', 'pace_ms'].sort();
	const files = fs.readdirSync(path.join(ROOT, 'bots', 'levels')).filter((f) => f.endsWith('.json'));
	assert.deepEqual(files.sort(), ['easy.json', 'normal.json', 'strong.json']);
	for (const f of files) {
		const j = levelJson(f.slice(0, -5));
		assert.deepEqual(Object.keys(j).sort(), keys, f);
		const lv = parseLevel(j);
		assert.equal(lv.id, f.slice(0, -5));
		assert.equal(lv.format, 1);
		assert.ok(lv.name.ru && lv.name.en);
		assert.equal(lv.pace_ms, 700, f + ': pace_ms (contract default 700)');
	}
	// the levels must be ordered: more worlds, a budget at least as large and no more forgetting as the level rises
	// (the low level is weak by oversight: few worlds, forgotten voids, random rollouts; it need not play random cards)
	const [e, n, s] = ['easy', 'normal', 'strong'].map(levelJson);
	assert.ok(e.worlds < n.worlds && n.worlds < s.worlds);
	assert.ok(e.budget_plays <= n.budget_plays && n.budget_plays <= s.budget_plays);
	assert.ok(e.forget >= n.forget && n.forget >= s.forget);
	assert.ok(n.noise >= s.noise);
	assert.equal(BOT_ID, 'pimc');
});

test('parseLevel refuses unknown keys and bad values (adversarial)', () => {
	const ok = levelJson('normal');
	const bad = [
		{ ...ok, Worlds: 3 }, { ...ok, name: { ru: 'a', en: 'b', it: 'c' } }, { ...ok, worlds: '32' }, { ...ok, worlds: NaN }, { ...ok, worlds: Infinity },
		{ ...ok, budget_plays: 0 }, { ...ok, noise: -0.01 }, { ...ok, noise: '0.1' }, { ...ok, temperature: Infinity }, { ...ok, forget: 1.01 },
		{ ...ok, win_weight: NaN }, { ...ok, win_weight: '5' }, { ...ok, pace_ms: 1.5 }, { ...ok, rollout: 'Greedy' }, { ...ok, halving: 'true' },
		{ ...ok, id: '' }, { ...ok, id: 'random' }, { ...ok, format: '1' }, { ...ok, name: null }, { ...ok, name: { ru: 1, en: 'x' } },
		JSON.parse(JSON.stringify(ok).replace('{', '{"__proto__":{"x":1},')),
		{ id: 'random', name: { ru: 'r', en: 'r' } }, { id: 'RANDOM' }, {}, undefined, 7,
	];
	for (const b of bad) assert.throws(() => parseLevel(b), undefined, 'accepted: ' + JSON.stringify(b));
	assert.deepEqual(parseLevel({ id: 'random' }), { id: 'random' });
});

test('chooseAction validates an unparsed level the same way (a bad level throws, never plays)', () => {
	const g = game('meno', 3);
	const p = positions(g, 'pl', 1, (v) => v.legal.length > 1)[0];
	assert.throws(() => chooseAction({ game: g, view: p.view, level: { ...levelJson('easy'), extra: 1 }, seed: 's' }));
	assert.throws(() => chooseAction({ game: g, view: p.view, level: { id: 'random', worlds: 2 }, seed: 's' }));
	assert.doesNotThrow(() => chooseAction({ game: g, view: p.view, level: levelJson('easy'), seed: 's' }));
});
