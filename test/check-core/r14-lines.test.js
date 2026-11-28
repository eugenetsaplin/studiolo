// Revision 14, the lines of the breakdown: they add up to the total of every unit in steps of half a point (a whole point
// counted by fours).
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../core/index.js';
import { load, newH } from './lib.mjs';

// the policy of the checks: seeded, never an a monte proposal, the first card offered for the Fool
function play(h, seed, onAction) {
	const rng = makeRng('v1:' + seed);
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 4000) throw new Error('the hand does not end');
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const ok = legal.filter((a) => a.type !== 'a_monte_propose');
		const pool = ok.length ? ok : legal;
		const a = legal[0].type === 'fool_give' ? legal[0] : pool[rng.int(pool.length)];
		const r = h.apply(seat, a);
		assert.ok(r.ok, 'refused ' + JSON.stringify(a));
		if (onAction) onAction(h, seat, a, r);
	}
	return h;
}

const LINES = [['partita_4', 4, { group: 2 }], ['partita_4', 4, { group: 4 }], ['partita_3', 3], ['dottore', 5, { group: 2 }], ['dottore', 5, { group: 3 }], ['permesso_3', 3], ['chiamare_il_re', 4], ['venticinque', 2], ['baronetti', 2], ['permesso_5', 5]];

test('the lines of the breakdown add up to the total of every unit, in whole halves of a point (fours and pairs)', () => {
	for (const [id, n, options] of LINES) {
		const g = load(id, n, options ? { options } : {});
		const exact = !(options && options.group === 3);
		for (let i = 0; i < 60; i++) {
			const h = newH(g, `r14b-${id}-${i}`, i % n);
			play(h, `r14b${id}${i}`);
			const res = h.result();
			if (res.outcome === 'thrown_in') continue;
			for (const [q, b] of Object.entries(res.breakdown)) {
				assert.equal(b.won + b.fool + b.discard + b.stock, res.points[q], `${id}/${i}: breakdown of seat ${q}`);
				if (exact) for (const k of ['won', 'fool', 'discard', 'stock']) assert.ok(b[k] % 6 === 0, `${id}/${i}: ${k} of seat ${q} is ${b[k] / 12} points`);
			}
			for (let seat = 0; seat < n; seat++) {
				const sl = h.view(seat).scoreLines;
				for (const u of sl.units) {
					let sum = 0;
					for (const l of sl.lines) if (['groups', 'pairs', 'fool_card', 'discard', 'stock_cards'].includes(l.key)) sum += l.values[u.id];
					assert.equal(sum, sl.totals[u.id], `${id}/${i}: lines of ${u.id} seen from seat ${seat}`);
				}
			}
		}
	}
});

test('counted by fours the lines are whole points: no quarter points in the Fool, the discard or the heap', () => {
	const g = load('partita_4', 4, { options: { group: 4 } });
	for (let i = 0; i < 60; i++) {
		const h = newH(g, `r14c-${i}`, i % 4);
		play(h, `r14c${i}`);
		const sl = h.view(0).scoreLines;
		for (const l of sl.lines) if (l.by === 'unit' && l.unit === 'twelfths') for (const [id, v] of Object.entries(l.values)) assert.ok(v % 12 === 0, `${l.key} of ${id}: ${v / 12} points`);
	}
});

test('the payment line names the rule of the settle phase that paid (a lone player, a pair, the loose game)', () => {
	for (const [id, n] of [['chiamare_il_re', 4], ['permesso_6', 6], ['permesso_7', 7]]) {
		const g = load(id, n);
		const settles = g.plan.filter((e) => e.module === 'settle');
		assert.ok(settles.length >= 2, `${id}: more than one settle phase`);
		const seen = new Set();
		for (let i = 0; i < 80; i++) {
			const h = newH(g, `r14d-${id}-${i}`, i % n);
			play(h, `r14d${id}${i}`);
			const res = h.result();
			if (res.outcome === 'thrown_in' || res.contract === undefined || res.contract === null) continue;
			const want = settles.find((e) => e.when && Array.isArray(e.when.contract) && e.when.contract.includes(res.contract)) || settles.find((e) => !(e.when && e.when.contract)) || settles[0];
			const line = h.view(0).scoreLines.lines.find((l) => l.key === 'payments');
			assert.equal(line.rule, `hand.phases[${want.id}].settings.amount`, `${id}/${i}: contract ${res.contract}`);
			seen.add(want.id);
		}
		// the loose game is played only when all pass, which a random play meets rarely: the pair and the lone player are met
		assert.ok(seen.size >= (id === 'chiamare_il_re' ? 2 : 1), `${id}: the phases met (${[...seen].join(',')})`);
	}
});
