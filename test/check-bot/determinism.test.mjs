// Bot check: determinism. Same input, same answer: twice, from a clone, after other decisions, with the level parsed
// twice, after a JSON round trip of the view, in a worker thread, with a fresh Game object.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { loadGame } from '../../core/index.js';
import { chooseAction, parseLevel } from '../../bots/index.js';
import { PAIRS, game, getFile, level, levelJson, tiny, positions } from './lib.mjs';

const pick = (ps, k) => ps.filter((_, i) => i % Math.max(1, Math.floor(ps.length / k)) === 0).slice(0, k);

function jobs() {
	const out = [];
	for (const [id, n] of PAIRS) {
		const g = game(id, n);
		for (const p of pick(positions(g, `det:${id}`, 1, (v) => v.legal.length > 1), 4)) out.push({ id, seats: n, g, view: p.view, hand: p.hand, seed: `d:${id}:${p.log.length}` });
	}
	return out;
}

test('same input twice, a clone of the hand, a JSON round trip, a level parsed twice, a fresh Game', () => {
	const lvs = [tiny(), level('easy'), level('normal')];
	for (const j of jobs()) {
		for (const lv of lvs) {
			const a = chooseAction({ game: j.g, view: j.view, level: lv, seed: j.seed });
			const b = chooseAction({ game: j.g, view: j.view, level: lv, seed: j.seed });
			const c = chooseAction({ game: j.g, view: j.hand.clone().view(j.view.seat), level: lv, seed: j.seed });
			const d = chooseAction({ game: j.g, view: JSON.parse(JSON.stringify(j.view)), level: parseLevel(JSON.parse(JSON.stringify(lv))), seed: j.seed });
			assert.deepEqual(a, b);
			assert.deepEqual(a, c);
			assert.deepEqual(a, d);
		}
		const fresh = loadGame(j.id, getFile, { seats: j.seats });
		const lv = level('easy');
		assert.deepEqual(chooseAction({ game: fresh, view: j.view, level: lv, seed: j.seed }), chooseAction({ game: j.g, view: j.view, level: lv, seed: j.seed }));
	}
});

test('no hidden state between calls: answers do not depend on what was decided before', () => {
	const js = jobs();
	const lv = level('easy');
	const first = js.map((j) => chooseAction({ game: j.g, view: j.view, level: lv, seed: j.seed }));
	// interleave other decisions (other games, levels, seeds), then ask again in reverse order
	for (const j of js) chooseAction({ game: j.g, view: j.view, level: tiny({ temperature: 2, noise: 0.5 }), seed: 'other' });
	const again = js.slice().reverse().map((j) => chooseAction({ game: j.g, view: j.view, level: lv, seed: j.seed })).reverse();
	assert.deepEqual(again, first);
});

test('a worker thread gives the same answers as the main thread', async () => {
	const js = jobs();
	const lvJson = levelJson('normal');
	const lv = parseLevel(lvJson);
	const main = js.map((j) => chooseAction({ game: j.g, view: j.view, level: lv, seed: j.seed }));
	const payload = js.map((j) => ({ id: j.id, seats: j.seats, view: j.view, level: lvJson, seed: j.seed }));
	const w = new Worker(new URL('./det-worker.mjs', import.meta.url), { workerData: { vbot: true, jobs: payload } });
	const got = await new Promise((resolve, reject) => {
		w.once('message', resolve);
		w.once('error', reject);
	});
	await w.terminate();
	assert.deepEqual(got, main);
});

test('the seed matters: different seeds may differ, the same seed never does', () => {
	const g = game('meno', 4);
	const p = positions(g, 'seed', 1, (v) => v.legal.length > 4)[0];
	const lv = tiny({ temperature: 5 });
	const answers = new Set();
	for (let k = 0; k < 30; k++) answers.add(JSON.stringify(chooseAction({ game: g, view: p.view, level: lv, seed: 'k' + k }).action));
	assert.ok(answers.size > 1, 'temperature 5 over 30 seeds always gave one answer');
});
