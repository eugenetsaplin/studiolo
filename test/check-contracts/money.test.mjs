// Independent check of the contract games: the money of Permesso by the book, against an oracle written apart from the core.
// Torino 1787 p. 68: 40 points on «three» at three players lose six soldi, three to each; pp. 69-70: points are
// rounded to fives, a half five down (62 is 60, 57 is 55, 67½ is 65, 33 is 35); 46 wins; at three 45½ is a draw dealt
// again by the next dealer, 43½ to 45 pay the Onoranza alone; at four and more 45½ loses (Onoranza alone).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng } from '../../core/index.js';
import { stepsOf } from '../../core/modules/settle.js';
import { load, step } from './lib.mjs';

const P = { of: 'declarer_side', from: 45, every: 5, unit: 1, round: 'nearest_half_down', direction: 'both' };

// the oracle: points (a number, halves allowed) rounded to fives, a half five down; steps from 45
function oracleSteps(points) {
	const r = 5 * Math.ceil(points / 5 - 0.5);
	return (r - 45) / 5;
}

test('the roundings of pp. 69-70 and the example of p. 68', () => {
	for (const [pts, rounded] of [[62, 60], [57, 55], [67.5, 65], [33, 35], [47.5, 45], [42.5, 40], [40, 40], [46, 45], [48, 50]]) {
		assert.equal(stepsOf(Math.round(pts * 12), P), (rounded - 45) / 5, `${pts} is ${rounded}`);
		assert.equal(oracleSteps(pts), (rounded - 45) / 5);
	}
	// 40 on three (Onoranza 2): 2 + 1 = 3 to each of the two
	assert.equal(2 + Math.abs(stepsOf(40 * 12, P)), 3);
});

const N = Number(process.env.MONEY_HANDS || 150);
for (const [id, n] of [['permesso_3', 3], ['permesso_4', 4], ['permesso_5', 5], ['permesso_6', 6], ['permesso_7', 7]]) {
	test(`${id}: every played hand pays as the book says (declarer_vs_each against ${n - 1})`, () => {
		const g = load(id, n);
		let seen = { win: 0, loss: 0, onor: 0, draw: 0, thrown: 0 };
		for (let i = 0; i < N; i++) {
			const h = newHand(g, { seed: `vm:${id}:${i}`, dealer: i % n });
			const rng = makeRng('vm' + i);
			while (!h.isOver()) step(h, rng);
			const r = h.result();
			if (r.outcome === 'thrown_in') { seen.thrown++; assert.equal(r.payments.length, 0); continue; }
			const d = h.s.declarer;
			const c = h.contractById(h.s.contract);
			const side = h.sides().of[d];
			const pts = h.s.m.count.sidePoints[side] / 12;
			// total points of the deck: 91 at every seat count of Permesso
			const total = Object.values(h.s.m.count.sidePoints).reduce((a, b) => a + b, 0) / 12;
			assert.equal(total, 91, 'the points of the hand');
			let expect; // per opponent: + the declarer collects, - he pays, 0 nothing
			if (pts >= 46) { expect = c.onoranza + Math.abs(oracleSteps(pts)); seen.win++; }
			else if (pts === 45.5 && n === 3) { expect = 0; seen.draw++; assert.equal(r.outcome, 'draw'); }
			else if (pts >= 43.5) { expect = -c.onoranza; seen.onor++; }
			else { expect = -(c.onoranza + Math.abs(oracleSteps(pts))); seen.loss++; }
			for (let q = 0; q < n; q++) {
				if (q === d) continue;
				const net = r.payments.filter((p) => p.from === q && p.to === d).reduce((a, p) => a + p.amount, 0)
					- r.payments.filter((p) => p.from === d && p.to === q).reduce((a, p) => a + p.amount, 0);
				assert.equal(net, expect, `${id} hand ${i}: contract ${c.id} points ${pts} seat ${q}`);
			}
		}
		assert.ok(seen.win + seen.loss + seen.onor > N / 3, 'enough contracts played ' + JSON.stringify(seen));
	});
}

test('lay fewer than bid: bid «two», lay one and stop: the contract becomes «one» with its Onoranza', () => {
	const g = load('permesso_3', 3);
	for (let i = 0; i < 40; i++) {
		const h = newHand(g, { seed: 'd5:' + i, dealer: 0 });
		const rng = makeRng('d5');
		while (h.s.phase !== 'bidding') step(h, rng);
		// order dealer right first: 1, 2, 0
		h.apply(1, { type: 'bid_two' });
		h.apply(2, { type: 'pass' });
		h.apply(0, { type: 'pass' });
		assert.equal(h.s.contract, 'two');
		assert.equal(h.s.phase, 'exchange');
		const lay = h.legal(1).find((a) => a.type === 'lay_down');
		assert.ok(!h.legal(1).some((a) => a.type === 'lay_done'), 'lay_done needs one card laid first');
		assert.ok(h.apply(1, lay).ok);
		assert.ok(h.legal(1).some((a) => a.type === 'lay_done'));
		assert.ok(h.apply(1, { type: 'lay_done' }).ok);
		assert.equal(h.s.contract, 'one');
		assert.equal(h.view(2).contract.id, 'one');
		assert.equal(h.view(2).contract.laid, 1);
		const calls = h.legal(1).filter((a) => a.type === 'call');
		assert.ok(h.apply(1, calls[0]).ok);
		assert.notEqual(h.s.phase, 'exchange', 'one call for one laid card');
		return;
	}
});
