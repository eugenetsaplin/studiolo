// Bot check: the bot never sees hidden cards. Twin deals (hidden cards swapped between the other hands, the other
// discards, the stock and the rest; the log replayed) give a deep-equal view; the answer, the eval and the sampled
// worlds must be the same. The bot must not change the view it is given.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { prepare, sampleWorld } from '../../bots/worlds.js';
import { PAIRS, ROOT, game, level, tiny, positions, twinOf, deepFreeze, same } from './lib.mjs';

const isCard = (v) => v.legal.length > 1 && (v.legal[0].type === 'play' || v.legal[0].type === 'discard');

test('twin deals: same view, same answer, same eval, same worlds (13 pairs)', () => {
	const lvTiny = tiny({ noise: 0, forget: 0.3 });
	const lvEasy = level('easy');
	const lvNormal = level('normal');
	let twins = 0;
	let discards = 0;
	let hiddenDiscards = 0;
	for (const [id, n] of PAIRS) {
		const g = game(id, n);
		const ps = positions(g, `vo:${id}:${n}`, 4, isCard);
		const rng = makeRng(`twin:${id}:${n}`);
		let found = 0;
		// a spread of positions: the discard, the first lead, mid-hand, late
		const pick = ps.filter((_, i) => i % Math.max(1, Math.floor(ps.length / 14)) === 0);
		for (const p of pick) {
			const tw = twinOf(g, p.seed, p.dealer, p.preset, p.log, p.me, rng);
			if (!tw) continue;
			found++;
			const va = tw.a.view(p.me);
			const vb = tw.b.view(p.me);
			assert.deepEqual(va, vb);
			if (va.legal[0].type === 'discard') discards++;
			if (tw.discardsDiffer) hiddenDiscards++;
			for (const lv of found <= 2 ? [lvTiny, lvEasy, lvNormal] : [lvTiny]) {
				const ra = chooseAction({ game: g, view: va, level: lv, seed: 'twin' + found });
				const rb = chooseAction({ game: g, view: vb, level: lv, seed: 'twin' + found });
				assert.deepEqual(ra, rb, `${id}:${n} ${lv.id}: twin deals gave different answers`);
			}
			const ia = prepare(g, va);
			const ib = prepare(g, vb);
			for (let w = 0; w < 3; w++) {
				const wa = sampleWorld(g, va, ia, lvTiny, makeRng, 'tw', w);
				const wb = sampleWorld(g, vb, ib, lvTiny, makeRng, 'tw', w);
				assert.equal(!!wa, !!wb);
				if (wa) assert.deepEqual(wa.hand.snapshot(), wb.hand.snapshot(), `${id}:${n}: worlds differ between twins`);
			}
		}
		assert.ok(found >= 3, `${id}:${n}: only ${found} twin deals found`);
		twins += found;
	}
	assert.ok(twins >= 60, 'twins: ' + twins);
	assert.ok(discards >= 1, 'no twin at a discard');
	assert.ok(hiddenDiscards >= 5, 'twins with another seat discard changed: ' + hiddenDiscards);
	console.log(`twins ${twins}, at a discard ${discards}, another seat's discard changed ${hiddenDiscards}`);
});

test('the bot does not change the view (deep-frozen view, same answer)', () => {
	const lv = tiny();
	for (const [id, n] of PAIRS) {
		const g = game(id, n);
		const ps = positions(g, `fz:${id}`, 1, (v) => v.legal.length > 1);
		for (const p of ps.filter((_, i) => i % 5 === 0)) {
			const plain = chooseAction({ game: g, view: structuredClone(p.view), level: lv, seed: 'fz' });
			const frozen = deepFreeze(structuredClone(p.view));
			const before = JSON.stringify(frozen);
			const r = chooseAction({ game: g, view: frozen, level: lv, seed: 'fz' });
			assert.equal(JSON.stringify(frozen), before);
			assert.deepEqual(r, plain);
		}
	}
});

test('a world holds no more of the real hidden cards than chance (first trick, no voids yet)', () => {
	// the first decision of the play: no history, so a world's hand of seat q is a uniform draw from the unknown
	// cards (bars aside). The overlap with the real hand must sit near handNeed / pool.
	const lv = tiny({ forget: 0 });
	for (const [id, n] of [['meno', 4], ['meno', 7], ['partita_3', 3], ['venticinque', 2]]) {
		const g = game(id, n);
		const ps = positions(g, `ov:${id}`, 40, (v) => v.legal[0].type === 'play' && v.tricks.length === 0 && v.trick.cards.length === 0);
		let got = 0;
		let expect = 0;
		for (const p of ps) {
			const info = prepare(g, p.view);
			const real = p.hand.snapshot().hands;
			for (let w = 0; w < 4; w++) {
				const world = sampleWorld(g, p.view, info, lv, makeRng, 'ov' + w, w);
				if (!world) continue;
				const wh = world.hand.snapshot().hands;
				for (let q = 0; q < n; q++) {
					if (q === p.me || !info.handNeed[q]) continue;
					const realSet = new Set(real[q]);
					got += wh[q].filter((c) => realSet.has(c)).length;
					expect += (info.handNeed[q] * real[q].length) / info.pool.length;
				}
			}
		}
		const ratio = got / expect;
		assert.ok(ratio > 0.85 && ratio < 1.15, `${id}:${n}: overlap with the real hidden hands is ${ratio.toFixed(3)} of chance`);
	}
});

test('static: bots/ never takes a snapshot, a log or a seed of the real hand', () => {
	for (const f of fs.readdirSync(path.join(ROOT, 'bots')).filter((x) => x.endsWith('.js'))) {
		const src = fs.readFileSync(path.join(ROOT, 'bots', f), 'utf8');
		assert.ok(!/\.snapshot\s*\(/.test(src), f + ' calls snapshot()');
		assert.ok(!/\.log\b/.test(src), f + ' reads a log');
		assert.ok(!/\bview\.s\b|\bview\.seed\b/.test(src), f + ' reads hidden state off the view');
	}
	// the only `.s.` reads are on the bot's own simulated hand inside rollouts
	const roll = fs.readFileSync(path.join(ROOT, 'bots', 'rollout.js'), 'utf8');
	assert.ok(same((roll.match(/hand\.s\.\w+/g) || []).sort(), ['hand.s.hands', 'hand.s.trick']));
});
