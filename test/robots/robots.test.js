// The robots suite: 200 random hands for every runnable (game, seats), and for every alt the core plays; all checks on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getFile, runCase, runnableCases, altTasks, selectCases, totalFailures } from '../../tools/robots.mjs';

const cases = runnableCases();
const HANDS = 200;

test('the runnable cases include 2, 3, 4 and 7 seats', () => {
	const have = new Set(cases.map((c) => `${c.id}:${c.seats}`));
	for (const k of ['venticinque:2', 'partita_4:4', 'meno:7']) assert.ok(have.has(k), k);
	assert.ok(have.has('venticinque_3:3') || have.has('partita_3:3'));
});

for (const c of cases) {
	test(`${c.id} with ${c.seats} seats: ${HANDS} hands, every check clean`, () => {
		const row = runCase({ id: c.id, seats: c.seats, deals: HANDS, seed: 'test', secrecy: 20 });
		assert.equal(row.error, null);
		assert.ok(row.hands >= HANDS, 'hands played');
		assert.ok(row.actions > row.hands * 10, 'actions played');
		assert.deepEqual(row.samples, [], JSON.stringify(row.samples.slice(0, 2)));
		assert.equal(totalFailures([row]), 0);
		assert.ok(row.tried > 0 && row.refusedOk === row.tried, 'illegal actions were tried and all refused');
		assert.equal(row.census.hands, row.hands);
	});
}

for (const t of altTasks(cases)) {
	test(`alt ${t.id} (${t.seats}) ${t.alt}: ${HANDS} hands, every check clean`, () => {
		const row = runCase({ ...t, deals: HANDS, seed: 'test', secrecy: 10 });
		assert.equal(row.error, null);
		assert.deepEqual(row.samples, [], JSON.stringify(row.samples.slice(0, 2)));
		assert.ok(row.hands >= HANDS);
	});
}

test('a game that is not runnable is refused, not played', () => {
	// every game of the book is playable now: a file with a phase of a module the core lacks stands for the rest
	const unplayable = (x) => { const f = getFile(x); f.hand.phases.push({ id: 'zz', module: 'no_such_module', settings: {} }); return f; };
	const row = runCase({ id: 'sedici_2', seats: 2, deals: 5, seed: 'test', getFile: unplayable });
	assert.match(row.error, /not runnable/);
	assert.equal(row.hands, 0);
	assert.throws(() => selectCases('no_such_game'), /no such game/);
	assert.equal(selectCases('sedici_2:2').length, 1);
});

test('the same seed gives the same hands', () => {
	const a = runCase({ id: 'partita_4', seats: 4, deals: 30, seed: 'same' });
	const b = runCase({ id: 'partita_4', seats: 4, deals: 30, seed: 'same' });
	assert.deepEqual([a.actions, a.census], [b.actions, b.census]);
	const c = runCase({ id: 'partita_4', seats: 4, deals: 30, seed: 'other' });
	assert.notEqual(a.actions + JSON.stringify(a.census), c.actions + JSON.stringify(c.census));
});
