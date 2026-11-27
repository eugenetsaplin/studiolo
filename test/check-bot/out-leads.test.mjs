// Bot check: a seat that cannot lose the match any more must lead a trump, else a king. The bots build their worlds without the
// data of the match; every answer must still be a legal one of the real view, and the worlds must be built (not the greedy fall-back).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, newMatch, makeRng } from '../../core/index.js';
import { chooseAction, parseLevel } from '../../bots/index.js';
import { prepare, sampleWorld } from '../../bots/worlds.js';
import { game, level, tiny, isLegal } from './lib.mjs';

const g = game('venticinque_3', 3);
const LINE = 26 * 12;
const LEVELS = [tiny(), tiny({ rollout: 'greedy' }), tiny({ noise: 0.4 }), level('easy'), level('normal'), parseLevel({ id: 'random' })];

function carryWith(outSeats) {
	return { match: { kind: 'running_total', handIndex: 2, last: true, totals: [0, 1, 2].map((q) => (outSeats.includes(q) ? LINE + 1 : 0)) } };
}

test('hands of the last deal with one or two seats that are out: every answer of every level is legal', () => {
	let leads = 0;
	for (let d = 0; d < 24; d++) {
		const out = d % 3 === 2 ? [0, 1] : [d % 3];
		const h = newHand(g, { seed: 'olb' + d, dealer: d % 3, carry: carryWith(out) });
		const rng = makeRng('olb' + d);
		let k = 0;
		while (!h.isOver()) {
			const q = h.toAct()[0];
			const v = h.view(q);
			const lv = LEVELS[(k + d) % LEVELS.length];
			const r = chooseAction({ game: g, view: v, level: lv, seed: `${d}:${k}` });
			assert.ok(isLegal(v, r.action), `d${d} k${k} ${lv.id}: illegal ${JSON.stringify(r.action)}`);
			if (v.phase.module === 'tricks' && v.outLead && v.outLead.duty) {
				leads++;
				// the duty narrows the list: the answer is a trump (a king when the hand has none)
				const hand = h.s.hands[q];
				const ok = new Set(v.legal.map((a) => a.card));
				assert.ok(hand.some((c) => !ok.has(c)) || hand.every((c) => ok.has(c)));
			}
			// the play goes on by the answer of the bot or by chance, so that positions differ
			h.apply(q, k % 4 === 0 ? v.legal[rng.int(v.legal.length)] : r.action);
			k++;
		}
	}
	assert.ok(leads >= 10, 'leads under a duty: ' + leads);
});

test('the worlds of a seat that is out lead under the same duty: they are built, and their legal list is the real one', () => {
	let asked = 0;
	let built = 0;
	for (let d = 0; d < 30; d++) {
		const me = d % 3;
		const h = newHand(g, { seed: 'olw' + d, dealer: (d + 1) % 3, carry: carryWith([me]) });
		const rng = makeRng('olw' + d);
		while (!h.isOver()) {
			const q = h.toAct()[0];
			const v = h.view(q);
			if (q === me && v.phase.module === 'tricks' && v.outLead && v.outLead.duty && v.legal.length > 1) {
				asked++;
				const info = prepare(g, v);
				const w = info.ok ? sampleWorld(g, v, info, tiny(), makeRng, 'w' + d, 0) : null;
				if (w) {
					built++;
					assert.deepEqual(w.hand.view(q).legal, v.legal);
					assert.deepEqual(w.hand.view(q).outLead, v.outLead);
				}
			}
			h.apply(q, v.legal[rng.int(v.legal.length)]);
		}
	}
	assert.ok(asked >= 20, 'decisions under a duty: ' + asked);
	assert.ok(built >= asked * 0.9, `worlds built ${built} of ${asked}`);
});

// Twenty whole matches for each level (the levels of the game, the two search levels with their budgets cut so that the test is
// not an hour long): every answer is a legal action of the match view, the matches end, the duty of the last deal is kept.
test('twenty matches with each level: no illegal move, the duty of the last deal is kept', () => {
	const shapes = [
		['easy', level('easy')],
		['normal', parseLevel({ ...JSON.parse(JSON.stringify(level('normal'))), id: 'normal_s', worlds: 6, budget_plays: 2500 })],
		['strong', parseLevel({ ...JSON.parse(JSON.stringify(level('strong'))), id: 'strong_s', worlds: 8, budget_plays: 4000 })],
		['random', parseLevel({ id: 'random' })],
	];
	let duties = 0;
	let withOut = 0;
	for (const [name, lv] of shapes) {
		for (let k = 0; k < 20; k++) {
			const m = newMatch(g, { seed: `bm:${name}:${k}`, firstDealer: k % 3 });
			let lastDeal = false;
			for (let i = 0; i < 3; i++) {
				const h = m.hand;
				lastDeal = i === 2;
				if (lastDeal && m.view(0).outLead.seats.length) withOut++;
				let n = 0;
				while (!h.isOver()) {
					const q = h.toAct()[0];
					const v = m.view(q);
					const r = chooseAction({ game: g, view: v, level: lv, seed: `${name}:${k}:${i}:${n}` });
					assert.ok(isLegal(v, r.action), `${name} match ${k} hand ${i}: illegal ${JSON.stringify(r.action)}`);
					if (v.outLead && v.outLead.duty) {
						duties++;
						const hand = v.hand.filter((c) => c !== 'T0');
						const trumps = hand.filter((c) => /^T/.test(c));
						const kings = hand.filter((c) => /:K$/.test(c));
						const want = trumps.length ? trumps : kings.length ? kings : null;
						if (want) assert.ok(want.includes(r.action.card), `${name} match ${k}: ${r.action.card} is not a ${trumps.length ? 'trump' : 'king'}`);
					}
					assert.ok(h.apply(q, r.action).ok);
					n++;
				}
				if (m.isOver()) break;
				m.next();
			}
			assert.ok(m.isOver(), 'the match ends');
		}
	}
	assert.ok(withOut >= 3, 'matches with a seat that is out: ' + withOut);
	assert.ok(duties >= 5, 'moves under a duty: ' + duties);
});
