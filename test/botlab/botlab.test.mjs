// The bot lab harness on a few hands: it runs, it is repeatable, the numbers are well formed. No strength claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { playHand } from '../../tools/botlab/play.mjs';
import { wilson, percentile, threshold } from '../../tools/botlab/stats.mjs';
import { rowOf } from '../../tools/botlab/aggregate.mjs';
import { Pool } from '../../tools/botlab/pool.mjs';
import { runnablePairs, parseTargets, verdict, aloneText } from '../../tools/botlab.mjs';
import { census } from '../../tools/botlab/census.mjs';

test('stats helpers', () => {
	const w = wilson(0.5, 100);
	assert.ok(w.lo < 0.5 && w.hi > 0.5 && w.lo > 0.39 && w.hi < 0.61);
	assert.equal(percentile([5, 1, 3, 2, 4], 0.5), 3);
	assert.equal(percentile([], 0.5), null);
	assert.equal(threshold(2, false), 0.7);
	assert.equal(threshold(7, false), 0.26);
	assert.equal(threshold(4, true), 0.7);
});

test('runnable pairs: the 28 of the core (the 20 games without contracts and the twelve contract, declaration and race pairs)', () => {
	const pairs = runnablePairs();
	assert.equal(pairs.length, 28);
	const key = (p) => `${p.id}:${p.seats}`;
	for (const k of ['sedici_3:3', 'sedici_4:4', 'trentuno:3', 'trentuno:4', 'mitigati_2:2', 'bagattultimo:3', 'chiamare_il_re:4', 'permesso_3:3', 'permesso_4:4', 'permesso_5:5', 'permesso_6:6', 'permesso_7:7']) {
		assert.ok(pairs.some((p) => key(p) === k), k + ' is runnable');
	}
});

test('money: a contract game carries the net payment of seat a, the old games keep their old rows', () => {
	const recs = [];
	for (let h = 0; h < 6; h++) {
		const r = playHand({ id: 'permesso_3', seats: 3, seed: 'm', h, a: 'random', b: 'random' });
		assert.equal(r.error, undefined, JSON.stringify(r));
		assert.equal(typeof r.money, 'number');
		recs.push(r);
	}
	const row = rowOf({ id: 'permesso_3', seats: 3, alts: [], a: 'random', b: 'random', pairs: false, recs, timing: false });
	assert.equal(row.money.n, 6);
	assert.ok(row.money.lo <= row.money.mean && row.money.mean <= row.money.hi);
	assert.ok(row.thrownIn >= 0 && row.thrownIn <= 1);
	assert.ok(Object.values(row.contracts).reduce((a, b) => a + b, 0) <= 6);
	const old = playHand({ id: 'venticinque', seats: 2, seed: 'm', h: 0, a: 'random', b: 'random' });
	assert.equal(old.contract, undefined);
	assert.equal(old.aDeclared, undefined);
});

test('targets: the verdict of a pair', () => {
	assert.deepEqual(parseTargets('a:3=0.4,b:4=money'), { 'a:3': 0.4, 'b:4': 'money' });
	const r = { game: 'a', seats: 3, share: 0.45, lo: 0.4, fair: 0.333, money: { lo: 0.1 } };
	assert.match(verdict(r, { 'a:3': 0.4 }), /TARGET PASS/);
	assert.match(verdict(r, { 'a:3': 0.5 }), /TARGET FAIL/);
	assert.match(verdict(r, { 'a:3': 'money' }), /MONEY PASS/);
	assert.match(verdict({ ...r, money: { lo: -0.2 } }, { 'a:3': 'money' }), /MONEY FAIL/);
	assert.equal(verdict(r, {}), '');
});

test('bots alone: the table columns (thrown in, a declarer, declarer won, its money) and the verdict', () => {
	const recs = [];
	for (let h = 0; h < 8; h++) recs.push(playHand({ id: 'permesso_4', seats: 4, seed: 'al', h, a: 'random', b: 'random' }));
	const row = rowOf({ id: 'permesso_4', seats: 4, alts: [], a: 'random', b: 'random', pairs: false, recs, timing: false });
	const decl = recs.filter((r) => r.contract !== undefined);
	assert.equal(row.table.declaredShare, Math.round((decl.length / 8) * 1000) / 1000);
	assert.ok(decl.every((r) => typeof r.declarerMoney === 'number'));
	if (decl.length) assert.ok(row.table.declarerWon >= 0 && row.table.declarerWon <= 1 && row.table.declarerMoney.n === decl.length);
	assert.match(aloneText(row), /thrown in .* a declarer .* declarer won/);
	assert.deepEqual(parseTargets('p:4=alone'), { 'p:4': 'alone' });
	const ok = { game: 'p', seats: 4, thrownIn: 0.2, table: { declarerWon: 0.6 } };
	assert.match(verdict(ok, { 'p:4': 'alone' }), /ALONE PASS/);
	assert.match(verdict({ ...ok, thrownIn: 0.31 }, { 'p:4': 'alone' }), /ALONE FAIL/);
	assert.match(verdict({ ...ok, table: { declarerWon: 0.8 } }, { 'p:4': 'alone' }), /ALONE FAIL/);
	assert.match(verdict({ ...ok, table: { declarerWon: 0.4 } }, { 'p:4': 'alone' }), /ALONE FAIL/);
	const old = playHand({ id: 'venticinque', seats: 2, seed: 'm', h: 0, a: 'random', b: 'random' });
	assert.equal(old.declarerMoney, undefined);
});

test('census: whole matches of random robots, counts add up', () => {
	const row = census({ id: 'permesso_3', seats: 3, hands: 12, seed: 't' });
	assert.equal(row.errors, 0);
	assert.equal(row.refused, 0);
	assert.ok(row.hands >= 12 && row.matches >= 1 && row.matchesEnded >= 1);
	assert.ok(row.thrownIn <= row.hands);
});

test('hands: random against random, three games, same deals twice', () => {
	for (const [id, seats] of [['venticinque', 2], ['partita_4', 4], ['meno', 3]]) {
		const spec = { id, seats, seed: 't', a: 'random', b: 'random' };
		const recs = [];
		for (let h = 0; h < 4; h++) {
			const r = playHand({ ...spec, h });
			assert.equal(r.error, undefined, JSON.stringify(r));
			assert.ok(r.credit >= 0 && r.credit <= 1 && r.decisions > 10);
			assert.deepEqual(playHand({ ...spec, h }), r);
			recs.push(r);
		}
		const row = rowOf({ id, seats, alts: [], a: 'random', b: 'random', pairs: id === 'partita_4', recs, timing: false });
		assert.equal(row.hands, 4);
		assert.equal(row.errors, 0);
	}
});

test('pool: 20 hands, easy against random, in worker threads, with timing', async () => {
	const pool = new Pool(2);
	try {
		const recs = await pool.run({ id: 'venticinque', seats: 2, alts: [], seed: 't', from: 0, to: 20, a: 'easy', b: 'random', timing: true });
		assert.equal(recs.length, 20);
		assert.equal(recs.filter((r) => r.error).length, 0, JSON.stringify(recs.find((r) => r.error)));
		const row = rowOf({ id: 'venticinque', seats: 2, alts: [], a: 'easy', b: 'random', pairs: false, recs, timing: true });
		assert.equal(row.hands, 20);
		assert.ok(row.share >= 0 && row.share <= 1 && row.lo <= row.share && row.share <= row.hi);
		assert.ok(row.ms.all.max >= 0 && row.ms.think.n > 0);
		// the same deals for another pairing: the dealer and the seat of a repeat
		const again = await pool.run({ id: 'venticinque', seats: 2, alts: [], seed: 't', from: 0, to: 5, a: 'random', b: 'random' });
		assert.deepEqual(again.map((r) => [r.aSeat, r.dealer]), recs.slice(0, 5).map((r) => [r.aSeat, r.dealer]));
	} finally { await pool.close(); }
});
