import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction, parseLevel, BOT_ID } from '../../bots/index.js';
import { chooseAction as randomAction } from '../../bots/random.js';
import { PAIRS, game, level } from './lib.mjs';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

test('the bot id and the random level', () => {
	assert.equal(BOT_ID, 'pimc');
	const g = game('meno', 3);
	const h = newHand(g, { seed: 'r', dealer: 0 });
	const q = h.toAct()[0];
	const r = chooseAction({ game: g, view: h.view(q), level: parseLevel({ id: 'random' }), seed: 's' });
	assert.ok(h.legal(q).some((a) => same(a, r.action)));
});

test('determinism: the same input twice, and from a clone of the hand', () => {
	for (const [id, seats] of [['venticinque', 2], ['partita_4', 4], ['meno', 5]]) {
		const g = game(id, seats);
		const h = newHand(g, { seed: 'det', dealer: 1 });
		const rng = makeRng('det');
		for (let k = 0; k < 14; k++) {
			const q = h.toAct()[0];
			if (k % 3 === 0) {
				const a = chooseAction({ game: g, view: h.view(q), level: level('normal'), seed: 'x' + k });
				const b = chooseAction({ game: g, view: h.view(q), level: level('normal'), seed: 'x' + k });
				const c = chooseAction({ game: g, view: h.clone().view(q), level: level('normal'), seed: 'x' + k });
				assert.deepEqual(a, b);
				assert.deepEqual(a, c);
			}
			h.apply(q, randomAction(h.legal(q), rng));
		}
	}
});

// two deals that differ only in cards the acting seat cannot see: the answer must be the same
function twin(g, seed, seats) {
	const snap = newHand(g, { seed, dealer: 0 }).snapshot();
	const hands = {};
	for (const [q, cs] of Object.entries(snap.hands)) hands[q] = cs.concat(snap.discard[q]);
	const rest = snap.rest.concat(snap.stock);
	const make = (hs, r) => newHand(g, { seed, dealer: 0, preset: { hands: hs, rest: r } });
	const a = make(hands, rest);
	const hs = structuredClone(hands);
	const r2 = rest.slice();
	const q = seats - 1;
	if (r2.length) [hs[q][0], r2[0]] = [r2[0], hs[q][0]];
	else [hs[q][0], hs[seats - 2][0]] = [hs[seats - 2][0], hs[q][0]];
	return [a, make(hs, r2)];
}

test('view only: deals that look the same to the seat get the same answer', () => {
	for (const [id, seats] of [['venticinque', 2], ['meno', 4], ['partita_3', 3], ['dottore', 5]]) {
		const g = game(id, seats);
		const [a, b] = twin(g, 'twin' + id, seats);
		const me = a.toAct()[0];
		if (me >= seats - 2) continue;
		const va = a.view(me);
		const vb = b.view(me);
		assert.deepEqual(va, vb, id + ': the views must be equal');
		assert.notDeepEqual(a.snapshot().hands, b.snapshot().hands, id + ': the deals must differ');
		for (const lv of ['easy', 'normal']) {
			const ra = chooseAction({ game: g, view: va, level: level(lv), seed: 'vo' });
			const rb = chooseAction({ game: g, view: vb, level: level(lv), seed: 'vo' });
			assert.deepEqual(ra, rb, id + ' ' + lv);
		}
	}
});

test('the answer is always legal: 2000 decisions over the 13 pairs', () => {
	let count = 0;
	for (const [id, seats] of PAIRS) {
		const g = game(id, seats);
		for (let d = 0; d < 6; d++) {
			const h = newHand(g, { seed: `leg${id}${d}`, dealer: d % seats });
			const rng = makeRng('leg' + d);
			let k = 0;
			while (!h.isOver()) {
				const q = h.toAct()[0];
				const v = h.view(q);
				let act;
				if (k % 2 === 0 || d === 0) {
					const r = chooseAction({ game: g, view: v, level: level('easy'), seed: `s${d}:${k}` });
					assert.ok(v.legal.some((a) => same(a, r.action)), `${id}:${seats} illegal answer`);
					assert.equal(r.stats.candidates, v.legal.length);
					count++;
					act = r.action;
				} else act = randomAction(h.legal(q), rng);
				assert.ok(h.apply(q, act).ok);
				k++;
			}
		}
	}
	assert.ok(count >= 2000, 'decisions: ' + count);
});

test('the deal-throwing windows are answered', () => {
	const g = game('venticinque_3', 3);
	const h = newHand(g, { seed: 'mo', dealer: 0 });
	let monte = 0;
	while (!h.isOver() && h.cur.module === 'a_monte') {
		const q = h.toAct()[0];
		const r = chooseAction({ game: g, view: h.view(q), level: level('normal'), seed: 'm' + monte });
		assert.ok(h.legal(q).some((a) => same(a, r.action)));
		h.apply(q, r.action);
		monte++;
	}
	assert.ok(monte >= 3);
});

test('parseLevel refuses bad files', () => {
	const ok = JSON.parse(JSON.stringify(level('normal')));
	assert.doesNotThrow(() => parseLevel(ok));
	const bad = [{ ...ok, extra: 1 }, { ...ok, worlds: 0 }, { ...ok, worlds: 1.5 }, { ...ok, rollout: 'smart' }, { ...ok, noise: 2 }, { ...ok, forget: -0.1 },
		{ ...ok, temperature: -1 }, { ...ok, halving: 1 }, { ...ok, format: 2 }, { ...ok, name: { ru: 'x' } }, { ...ok, pace_ms: -5 }, { ...ok, id: 'Bad Id' },
		{ id: 'random', worlds: 3 }, null, [], 'x'];
	for (const b of bad) assert.throws(() => parseLevel(b), undefined, JSON.stringify(b));
	const miss = { ...ok };
	delete miss.noise;
	assert.throws(() => parseLevel(miss));
});

function playAgainstRandom(g, seats, hands, lv) {
	let wins = 0;
	let diff = 0;
	for (let d = 0; d < hands; d++) {
		const bot = d % seats;
		const h = newHand(g, { seed: 'sm' + d, dealer: (d >> 1) % seats });
		const rng = makeRng('smr' + d);
		let k = 0;
		while (!h.isOver()) {
			const q = h.toAct()[0];
			const a = q === bot ? chooseAction({ game: g, view: h.view(q), level: lv, seed: `b${d}:${k}` }).action : randomAction(h.legal(q), rng);
			assert.ok(h.apply(q, a).ok);
			k++;
		}
		const r = h.result();
		if (r.winners.includes(bot)) wins++;
		const mine = g.sides.of[bot];
		const others = Object.keys(r.sidePoints).filter((x) => Number(x) !== mine).map((x) => r.sidePoints[x]);
		diff += (r.sidePoints[mine] - others.reduce((s, x) => s + x, 0) / others.length) / 12;
	}
	return { wins, diff: diff / hands };
}

test('strength smoke: normal beats the random robot', () => {
	const a = playAgainstRandom(game('venticinque', 2), 2, 60, level('normal'));
	assert.ok(a.wins >= 36, `first game, 60 hands: ${a.wins} wins (fair share 30)`);
	const b = playAgainstRandom(game('meno', 4), 4, 30, level('normal'));
	assert.ok(b.diff < -3, `second game, 30 hands: points against the others ${b.diff.toFixed(1)} (fewer is better)`);
});

test('timing smoke: the median decision is under a second on every pair', () => {
	for (const [id, seats] of PAIRS) {
		const g = game(id, seats);
		const h = newHand(g, { seed: 'tm' + id, dealer: 0 });
		const times = [];
		let k = 0;
		while (!h.isOver()) {
			const q = h.toAct()[0];
			const v = h.view(q);
			const t = performance.now();
			const r = chooseAction({ game: g, view: v, level: level('normal'), seed: 't' + k++ });
			if (v.legal.length > 1) times.push(performance.now() - t);
			assert.ok(h.apply(q, r.action).ok);
		}
		times.sort((x, y) => x - y);
		const med = times[Math.floor(times.length / 2)];
		assert.ok(med < 1000, `${id}:${seats} median ${med}`);
	}
});
