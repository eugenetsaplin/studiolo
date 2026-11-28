// The cyclic mode of the bot lab: every deal once for every seat of level a, one observation per deal, a paired interval.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { playHand, gameOf, turnsOf } from '../../tools/botlab/play.mjs';
import { rowOf, cyclicRowOf } from '../../tools/botlab/aggregate.mjs';
import { tQuantile, pairedInterval } from '../../tools/botlab/stats.mjs';
import { Pool } from '../../tools/botlab/pool.mjs';
import { runPair, cyclicDeals, parseArgs, main, line } from '../../tools/botlab.mjs';

test('cyclic: normal against normal, one deal in every turn: the same deal, different games', () => {
	const seen = [];
	for (let turn = 0; turn < 2; turn++) {
		let first = null, last = null;
		const r = playHand({
			id: 'sedici_2', seats: 2, seed: 'cy', h: 0, mode: 'cyclic', turn, a: 'normal', b: 'normal',
			onDecision: ({ hand }) => { if (first === null) first = JSON.stringify(hand.s.hands); last = hand; },
		});
		assert.equal(r.error, undefined, JSON.stringify(r));
		assert.equal(r.turn, turn);
		assert.equal(r.aSeat, turn);
		assert.equal(r.dealer, 0);
		seen.push({ first, log: JSON.stringify(last.s.log) });
	}
	assert.equal(seen[0].first, seen[1].first, 'the deal is the same in every turn');
	assert.notEqual(seen[0].log, seen[1].log, 'the decisions differ between the turns');
	// repeatable: the same turn plays the same game
	const again = playHand({ id: 'sedici_2', seats: 2, seed: 'cy', h: 0, mode: 'cyclic', turn: 1, a: 'easy', b: 'random' });
	assert.deepEqual(again, playHand({ id: 'sedici_2', seats: 2, seed: 'cy', h: 0, mode: 'cyclic', turn: 1, a: 'easy', b: 'random' }));
});

test('unpaired mode: the same records and row as before the cyclic mode (golden file, no time fields)', () => {
	const golden = JSON.parse(fs.readFileSync(new URL('./fixtures/old-mode-golden.json', import.meta.url), 'utf8'));
	for (const [key, want] of Object.entries(golden)) {
		const [id, n] = key.split(':');
		const seats = Number(n);
		const recs = [];
		for (let h = 0; h < 6; h++) recs.push(playHand({ id, seats, seed: 'gold', h, a: 'easy', b: 'random' }));
		const row = rowOf({ id, seats, alts: [], a: 'easy', b: 'random', pairs: false, recs, timing: false });
		assert.deepEqual(JSON.parse(JSON.stringify(row)), want, key);
		assert.equal(row.mode, undefined);
	}
});

test('budget: 12 games at three seats are 4 deals of 3 games, a pair game has 2 turns', async () => {
	assert.equal(cyclicDeals({ budgetGames: 12, deals: 100 }, gameOf('permesso_3', 3)), 4);
	assert.equal(cyclicDeals({ budgetGames: 13, deals: 100 }, gameOf('permesso_3', 3)), 4);
	assert.equal(cyclicDeals({ budgetGames: null, deals: 7 }, gameOf('permesso_3', 3)), 7);
	assert.equal(turnsOf(gameOf('permesso_3', 3)), 3);
	assert.equal(turnsOf(gameOf('sedici_2', 2)), 2);
	assert.equal(turnsOf(gameOf('partita_4', 4)), 2);
	const o = parseArgs(['--games', 'permesso_3:3', '--a', 'random', '--b', 'random', '--mode', 'cyclic', '--budget-games', '12', '--seed', 'bg']);
	assert.equal(o.mode, 'cyclic');
	assert.equal(o.budgetGames, 12);
	const pool = new Pool(2);
	try {
		const { row, recs } = await runPair(pool, o, { id: 'permesso_3', seats: 3 }, 'random', 'random');
		assert.equal(row.deals, 4);
		assert.equal(row.hands, 12);
		assert.equal(row.turns, 3);
		assert.equal(recs.length, 12);
		for (let h = 0; h < 4; h++) assert.deepEqual(recs.filter((r) => r.h === h).map((r) => r.aSeat).sort(), [0, 1, 2]);
		assert.equal(row.money.n, 4, 'money is the mean over the deal: one number per deal');
		assert.match(line(row), /cyclic 4 deals x 3 = 12 games/);
	} finally { await pool.close(); }
});

test('stats: Student quantile, the paired interval, the protected one', () => {
	assert.ok(Math.abs(tQuantile(1) - 12.706) < 1e-3);
	assert.ok(Math.abs(tQuantile(10) - 2.228) < 1e-3);
	assert.ok(Math.abs(tQuantile(20) - 2.086) < 2e-3);
	assert.ok(Math.abs(tQuantile(30) - 2.042) < 2e-3);
	assert.ok(Math.abs(tQuantile(65) - 1.997) < 2e-3);
	assert.ok(Math.abs(tQuantile(1000) - 1.962) < 2e-3);
	const same = new Array(20).fill(0.5);
	assert.equal(pairedInterval(same).half, 0, 'plain: every deal 1:1 gives a point');
	const safe = pairedInterval(same, { safe: true, clamp: [0, 1] });
	assert.ok(safe.half > 0.05 && safe.lo >= 0 && safe.hi <= 1, 'safe: never a point');
	const xs = [0, 0.5, 1, 0.5, 0.5, 1, 0, 0.5];
	const p = pairedInterval(xs), s = pairedInterval(xs, { safe: true });
	assert.ok(Math.abs(p.mean - 0.5) < 1e-12);
	assert.ok(s.half > p.half);
	assert.equal(pairedInterval([0.4]).half, null);
});

test('cyclic row: a deal counts only with all its turns, the unit is the deal', () => {
	const mk = (h, turn, credit, money) => ({ h, turn, aSeat: turn, credit, money, thrownIn: 0, margin: 0, dealerCredit: 0, dealerMargin: 0, leaderCredit: 0, tie: 0, decisions: 1, worlds: 0, searched: 0, ms: [] });
	const recs = [mk(0, 0, 1, 2), mk(0, 1, 0, -2), mk(1, 0, 1, 4), mk(1, 1, 0, -4), mk(2, 0, 1, 1), { h: 2, turn: 1, error: 'x' }, mk(3, 0, 0.5, 0), mk(3, 1, 0.5, 0)];
	const row = cyclicRowOf({ id: 'g', seats: 2, alts: [], a: 'a', b: 'b', pairs: false, recs, turns: 2 });
	assert.equal(row.deals, 3);
	assert.equal(row.hands, 6);
	assert.equal(row.errors, 1);
	assert.equal(row.share, 0.5);
	assert.equal(row.money.mean, 0);
	assert.equal(row.mode, 'cyclic');
	assert.ok(row.old.share.half > 0 && row.interval.safeShare.half > row.interval.share.half);
});

test('cyclic mode refuses --alts, --alone, --timing, a budget without the mode', async () => {
	for (const extra of [['--alts'], ['--alone'], ['--timing']]) {
		await assert.rejects(main(['--games', 'sedici_2:2', '--mode', 'cyclic', ...extra]), /does not go with/);
	}
	await assert.rejects(main(['--games', 'sedici_2:2', '--budget-games', '10']), /cyclic mode only|go with --mode cyclic/);
	await assert.rejects(main(['--games', 'sedici_2:2', '--mode', 'cyclic', '--budget-games', '10', '--deals', '5']), /not both/);
	await assert.rejects(main(['--games', 'sedici_2:2', '--mode', 'zigzag']), /unpaired/);
});
