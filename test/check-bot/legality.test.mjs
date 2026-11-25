// Bot check: legality and robustness. 5000 decisions over the 13 pairs with every code path of the levels (noise,
// temperature, halving on and off, greedy and random rollouts, forget), and the views at the edges.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction, parseLevel } from '../../bots/index.js';
import { chooseAction as randomAction } from '../../bots/random.js';
import { prepare, sampleWorld } from '../../bots/worlds.js';
import { PAIRS, game, level, tiny, positions, isLegal, same } from './lib.mjs';

const LEVELS = () => [
	tiny(),
	tiny({ noise: 0.5 }),
	tiny({ temperature: 3 }),
	tiny({ temperature: 0.01, halving: false }),
	tiny({ rollout: 'greedy' }),
	tiny({ forget: 1, worlds: 2 }),
	tiny({ worlds: 1, budget_plays: 1 }),
	tiny({ win_weight: -5 }),
	level('easy'),
	parseLevel({ id: 'random' }),
];

function checkAnswer(view, r, lv, where) {
	assert.ok(r && typeof r === 'object', where + ': no answer');
	assert.ok(isLegal(view, r.action), `${where}: illegal answer ${JSON.stringify(r.action)}`);
	assert.ok(view.legal.includes(r.action) || isLegal(view, r.action));
	assert.ok(Array.isArray(r.eval) && r.eval.length <= 8, where + ': eval longer than 8');
	for (const e of r.eval) {
		assert.ok(isLegal(view, e.action), where + ': eval holds an illegal action');
		assert.equal(e.value, Math.round(e.value * 1000) / 1000, where + ': eval value not rounded to 3 decimals');
	}
	assert.equal(new Set(r.eval.map((e) => JSON.stringify(e.action))).size, r.eval.length, where + ': eval repeats an action');
	assert.equal(r.stats.candidates, view.legal.length);
	assert.ok(Number.isInteger(r.stats.worlds) && Number.isInteger(r.stats.plays));
	if (lv.id !== 'random' && lv.temperature === 0 && r.eval.length > 1) assert.ok(same(r.eval[0].action, r.action) || lv.noise > 0, where + ': eval[0] is not the answer');
	if (lv.id !== 'random') assert.ok(r.stats.plays <= lv.budget_plays + view.legal.length * 400, where + ': budget overrun ' + r.stats.plays);
}

test('5000 decisions over the 13 pairs: every answer is legal, the eval is well formed', () => {
	const lvs = LEVELS();
	let count = 0;
	const types = {};
	for (const [id, n] of PAIRS) {
		const g = game(id, n);
		const quota = Math.ceil(5000 / PAIRS.length);
		let mine = 0;
		for (let d = 0; mine < quota; d++) {
			const h = newHand(g, { seed: `leg5k:${id}:${n}:${d}`, dealer: d % n });
			const rng = makeRng(`leg5k:${d}`);
			let k = 0;
			while (!h.isOver()) {
				const seats = h.toAct();
				const acts = [];
				for (const q of seats) {
					const v = h.view(q);
					const lv = lvs[(k + d) % lvs.length];
					const r = chooseAction({ game: g, view: v, level: lv, seed: `${d}:${k}:${q}` });
					checkAnswer(v, r, lv, `${id}:${n} d${d} k${k} ${lv.id}`);
					types[v.legal[0].type] = (types[v.legal[0].type] || 0) + 1;
					count++;
					mine++;
					acts.push([q, k % 3 === 0 ? randomAction(h.legal(q), rng) : r.action]);
				}
				// a vote: every seat answers; apply one by one while the hand still waits for that seat
				for (const [q, a] of acts) if (h.toAct().includes(q) && h.legal(q).some((x) => same(x, a))) assert.ok(h.apply(q, a).ok);
				k++;
			}
		}
	}
	assert.ok(count >= 5000, 'decisions: ' + count);
	for (const t of ['play', 'discard', 'a_monte_propose', 'a_monte_agree', 'fool_give']) assert.ok(types[t] > 0, 'never asked: ' + t + ' ' + JSON.stringify(types));
});

test('edges: one legal action, the last trick, a 7-seat table', () => {
	const lv = level('normal');
	for (const [id, n] of [['meno', 7], ['venticinque', 2], ['partita_4', 4]]) {
		const g = game(id, n);
		const ps = positions(g, `edge:${id}`, 2, (v) => v.legal[0].type === 'play' && v.hand.length <= 2);
		assert.ok(ps.length > 0);
		for (const p of ps) {
			const r = chooseAction({ game: g, view: p.view, level: lv, seed: 'e' });
			assert.ok(isLegal(p.view, r.action));
			if (p.view.legal.length === 1) assert.deepEqual(r.action, p.view.legal[0]);
		}
	}
});

test('edges: the discard (dealer of the first game, 28 cards) answers a legal card and is deterministic', () => {
	for (const [id, n] of [['venticinque', 2], ['venticinque_3', 3], ['dottore', 5], ['partita_3', 3]]) {
		const g = game(id, n);
		const ps = positions(g, `disc:${id}`, 3, (v) => v.legal[0].type === 'discard');
		assert.ok(ps.length > 0, id + ': no discard position');
		for (const p of ps.slice(0, 6)) {
			for (const lv of [level('easy'), level('normal')]) {
				const r = chooseAction({ game: g, view: p.view, level: lv, seed: 'disc' });
				assert.ok(isLegal(p.view, r.action), id + ': illegal discard');
				assert.deepEqual(chooseAction({ game: g, view: p.view, level: lv, seed: 'disc' }), r);
			}
		}
	}
});

test('edges: deal-throwing windows (propose / pass, agree / refuse)', () => {
	const g = game('venticinque_3', 3);
	let ask = 0;
	let vote = 0;
	for (let d = 0; d < 40; d++) {
		const h = newHand(g, { seed: 'am' + d, dealer: d % 3 });
		let guard = 0;
		while (!h.isOver() && h.cur.module === 'a_monte' && guard++ < 50) {
			const seats = h.toAct();
			for (const q of seats) {
				const v = h.view(q);
				const r = chooseAction({ game: g, view: v, level: level('normal'), seed: 'am' });
				assert.ok(isLegal(v, r.action));
				if (v.aMonte && v.aMonte.stage === 'vote') vote++;
				else ask++;
			}
			// force a vote now and then: the first seat proposes
			const q = seats[0];
			const prop = h.legal(q).find((a) => a.type === 'a_monte_propose');
			const a = prop && d % 2 === 0 ? prop : chooseAction({ game: g, view: h.view(q), level: level('normal'), seed: 'am' }).action;
			h.apply(q, a);
		}
	}
	assert.ok(ask > 10 && vote > 5, `ask ${ask} vote ${vote}`);
});

test("edges: the Fool's card to give (owner's choice)", () => {
	let seen = 0;
	for (const [id, n] of [['partita_3', 3], ['partita_4', 4], ['dottore', 5]]) {
		const g = game(id, n);
		const ps = positions(g, `fg:${id}`, 30, (v) => v.legal[0].type === 'fool_give');
		for (const p of ps) {
			const r = chooseAction({ game: g, view: p.view, level: level('normal'), seed: 'fg' });
			assert.ok(isLegal(p.view, r.action));
			seen++;
		}
	}
	assert.ok(seen > 0, 'no fool_give position found');
});

test("edges: a partner's hand shown (consiglio): the worlds hold it exactly", () => {
	const g = game('consiglio', 4);
	const ps = positions(g, 'ph', 3, (v) => v.legal.length > 1 && v.legal[0].type === 'play');
	assert.ok(ps.length > 0);
	let checked = 0;
	for (const p of ps) {
		assert.ok(p.view.partnerHands && Object.keys(p.view.partnerHands).length === 1, 'consiglio: no partner hand in the view');
		const info = prepare(g, p.view);
		const w = sampleWorld(g, p.view, info, level('normal'), makeRng, 'ph', 0);
		if (!w) continue;
		const s = w.hand.snapshot();
		for (const [q, cards] of Object.entries(p.view.partnerHands)) assert.deepEqual(s.hands[q], cards);
		const r = chooseAction({ game: g, view: p.view, level: level('easy'), seed: 'ph' });
		assert.ok(isLegal(p.view, r.action));
		checked++;
	}
	assert.ok(checked > 10);
});

test('a view with no legal action (not to act) gives action null, never a throw', () => {
	const g = game('meno', 3);
	const h = newHand(g, { seed: 'na', dealer: 0 });
	const other = (h.toAct()[0] + 1) % 3;
	const v = h.view(other);
	assert.equal(v.legal.length, 0);
	const r = chooseAction({ game: g, view: v, level: level('normal'), seed: 'na' });
	assert.equal(r.action, null);
});
