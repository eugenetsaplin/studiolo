// The result bands and the money of the declarer games, by the examples of the book (Permesso, pp. 66-70).
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, playRandom } from './helpers.js';
import { bandOf } from '../../core/modules/result.js';
import { stepsOf } from '../../core/modules/settle.js';
import * as result from '../../core/modules/result.js';
import * as settle from '../../core/modules/settle.js';

const PER = { of: 'declarer_side', from: 45, every: 5, unit: 1, round: 'nearest_half_down', direction: 'both' };
const BANDS3 = [
	{ min: 46, outcome: 'win', pays: 'full' },
	{ min: 45.5, max: 45.5, outcome: 'draw', pays: 'nothing' },
	{ min: 43.5, max: 45, outcome: 'loss', pays: 'onoranza_only' },
	{ max: 43, outcome: 'loss', pays: 'full' },
];

test('rounding of the points: 62 is 60, 57 is 55, 67.5 is 65, 33 is 35, 47.5 is 45', () => {
	const at = (pts) => stepsOf(pts * 12, PER) * 5 + 45;
	assert.equal(at(62), 60);
	assert.equal(at(57), 55);
	assert.equal(at(67.5), 65);
	assert.equal(at(33), 35);
	assert.equal(at(47.5), 45);
	assert.equal(at(42.5), 40);
	assert.equal(stepsOf(46 * 12, PER), 0);
	assert.equal(stepsOf(40 * 12, PER), -1);
	assert.equal(stepsOf(50 * 12, { ...PER, round: 'down' }), 1);
	assert.equal(stepsOf(47 * 12, { ...PER, round: 'up' }), 1);
	assert.equal(stepsOf(47.5 * 12, { ...PER, round: 'nearest_half_up' }), 1);
});

test('the bands: 46 wins, 45.5 is a draw, 43.5 to 45 loses the Onoranza only, 43 and less loses all', () => {
	const row = (p) => bandOf(BANDS3, Math.round(p * 12));
	assert.equal(row(46).outcome, 'win');
	assert.equal(row(70).outcome, 'win');
	assert.equal(row(45.5).outcome, 'draw');
	for (const p of [45, 44, 43.5]) assert.deepEqual([row(p).outcome, row(p).pays], ['loss', 'onoranza_only']);
	for (const p of [43, 40, 12]) assert.deepEqual([row(p).outcome, row(p).pays], ['loss', 'full']);
});

// a finished hand of the game, with the points of the declarer's side set by hand: result and settle run again on it
function judged(id, seats, seed, declPoints) {
	let h;
	for (let i = 0; i < 80; i++) {
		const g = load(id, seats);
		const c = playRandom(g, seed + i, i % seats);
		if (c.s.declarer !== null && c.s.result.outcome !== 'thrown_in') { h = c; break; }
	}
	const w = h.clone();
	const s = w.s;
	const d = s.declarer;
	const side = w.sides().of[d];
	const sp = { ...s.m.count.sidePoints };
	for (const k of Object.keys(sp)) sp[k] = Number(k) === side ? Math.round(declPoints * 12) : Math.round((91 - declPoints) * 12);
	s.m.count.sidePoints = sp;
	const points = {};
	for (let q = 0; q < s.n; q++) points[q] = sp[w.sides().of[q]];
	s.m.count.points = points;
	s.result = null;
	s.payments = undefined;
	const ri = w.game.plan.findIndex((e) => e.module === 'result');
	const si = w.game.plan.findIndex((e) => e.module === 'settle' && w.runs(e));
	s.pi = ri;
	result.enter(w);
	s.pi = si;
	settle.enter(w);
	return w;
}
const sum = (r, from) => r.payments.filter((p) => p.from === from).reduce((a, p) => a + p.amount, 0);

test('permesso_3: 40 points on three lose six soldi, three to each (the Onoranza 2 and one for 5 points)', () => {
	const w = judged('permesso_3', 3, 'm1:', 40);
	// the contract of that random hand is whatever it is: re-judge with the contract three
	w.s.contract = 'three';
	const s = w.s;
	s.result = null;
	s.pi = w.game.plan.findIndex((e) => e.module === 'result');
	result.enter(w);
	s.pi = w.game.plan.findIndex((e) => e.module === 'settle');
	settle.enter(w);
	const r = s.result;
	assert.equal(r.band.outcome, 'loss');
	assert.equal(sum(r, s.declarer), 6);
	const to = r.payments.filter((p) => p.from === s.declarer);
	assert.ok(to.every((p) => p.to !== s.declarer));
	const perOpp = {};
	for (const p of to) perOpp[p.to] = (perOpp[p.to] || 0) + p.amount;
	assert.deepEqual(Object.values(perOpp), [3, 3]);
	assert.deepEqual(new Set(r.payments.map((p) => p.why)), new Set(['onoranza', 'points']));
});

test('permesso_3: 46 wins, the declarer collects from each; 44 loses the Onoranza only; 45.5 is a draw and pays nothing', () => {
	const win = judged('permesso_3', 3, 'm2:', 51);
	assert.equal(win.s.result.band.outcome, 'win');
	assert.equal(win.s.result.outcome, 'win');
	assert.deepEqual(win.s.result.winners, [win.s.declarer]);
	const c = win.contractById(win.s.contract);
	const got = win.s.result.payments.filter((p) => p.to === win.s.declarer);
	assert.equal(new Set(got.map((p) => p.from)).size, 2);
	assert.equal(got.reduce((a, p) => a + p.amount, 0), 2 * (c.onoranza + 1));

	const part = judged('permesso_3', 3, 'm3:', 44);
	const cp = part.contractById(part.s.contract);
	assert.equal(part.s.result.band.pays, 'onoranza_only');
	assert.equal(sum(part.s.result, part.s.declarer), 2 * cp.onoranza);
	assert.ok(part.s.result.payments.every((p) => p.why === 'onoranza'));

	const draw = judged('permesso_3', 3, 'm4:', 45.5);
	assert.equal(draw.s.result.outcome, 'draw');
	assert.deepEqual(draw.s.result.payments, []);
	assert.deepEqual(draw.s.result.winners, []);
	assert.deepEqual(draw.s.result.gamePoints, { 0: 0, 1: 0, 2: 0 });
});

test('permesso_4: the lone player pays and collects against each of three', () => {
	const lost = judged('permesso_4', 4, 'm5:', 40);
	const d = lost.s.declarer;
	const rows = lost.s.result.payments.filter((p) => p.from === d);
	assert.equal(new Set(rows.map((p) => p.to)).size, 3);
	// 45.5 at four is not a draw: it loses the Onoranza only
	const eq = judged('permesso_4', 4, 'm6:', 45.5);
	assert.equal(eq.s.result.band.outcome, 'loss');
	assert.equal(eq.s.result.band.pays, 'onoranza_only');
	assert.equal(eq.s.result.outcome, 'win');
	assert.notEqual(eq.s.result.winners.includes(eq.s.declarer), true);
});

test('chiamare_il_re: equal points lose for the declarer side; unequal sides play as declarer against each', () => {
	const g = load('chiamare_il_re', 4);
	let seen = 0;
	for (let i = 0; i < 120 && seen < 3; i++) {
		const h = playRandom(g, 'm7:' + i, i % 4);
		const r = h.s.result;
		if (r.outcome === 'thrown_in') continue;
		seen++;
		const net = {};
		for (const p of r.payments) { net[p.from] = (net[p.from] || 0) - p.amount; net[p.to] = (net[p.to] || 0) + p.amount; }
		assert.equal(Object.values(net).reduce((a, b) => a + b, 0), 0);
		assert.equal(r.contract, h.s.contract);
		assert.equal(r.declarer, h.s.declarer);
		const decl = h.sides().of[h.s.declarer];
		const mine = r.sidePoints[decl];
		assert.equal(r.winners.includes(h.s.declarer), mine >= 46 * 12);
	}
	assert.ok(seen > 0);
});

test('every payment of a contract hand balances: what is paid is what is received', () => {
	for (const [id, n] of [['permesso_3', 3], ['permesso_5', 5], ['permesso_6', 6], ['permesso_7', 7]]) {
		const g = load(id, n);
		for (let i = 0; i < 25; i++) {
			const h = playRandom(g, 'm8:' + i, i % n);
			let total = 0;
			for (const p of h.s.result.payments) { assert.ok(p.amount > 0 && p.from !== p.to); total += p.amount; }
			assert.ok(total >= 0);
		}
	}
});

// Permesso for three, 45 and 45½ with the card for the Fool (pp. 66-70): the numbers of the book are named before that card
// changes hands, and the card is worth half a point. The piles are set by hand; the count and the result run on the real file.
test('permesso_3: the Fool card is half a point: 45 with a card owed is a draw, 46 with a card to pay is a draw, 45 with none is a loss of the Onoranza', async () => {
	const count = await import('../../core/modules/count.js');
	const KINGS = ['swords:K', 'batons:K', 'cups:K', 'coins:K'];
	const QUEENS = ['swords:Q', 'batons:Q', 'cups:Q', 'coins:Q'];
	const KNIGHTS = ['swords:N', 'batons:N', 'cups:N'];
	const PLAIN = ['swords:1', 'swords:2', 'swords:3', 'swords:4', 'swords:5', 'swords:6', 'swords:7', 'swords:8', 'swords:9', 'swords:10', 'batons:1'];
	const pairs = [...KINGS, ...QUEENS, ...KNIGHTS].flatMap((c, i) => [c, PLAIN[i]]); // 11 pairs: 4 x 5 + 4 x 4 + 3 x 3 = 45
	const settled = (extra, fool, toOpp = []) => {
		let h;
		for (let i = 0; i < 80 && !h; i++) {
			const c = playRandom(load('permesso_3', 3), 'f45:' + i, i % 3);
			if (c.s.declarer !== null && c.s.result.outcome !== 'thrown_in') h = c;
		}
		const w = h.clone();
		const s = w.s;
		const d = s.declarer;
		const o = (d + 1) % 3;
		const mine = [...pairs, ...extra];
		s.won = [[], [], []];
		s.won[d] = mine.slice();
		s.won[o] = [...toOpp, 'cups:2', 'cups:3', 'cups:4'];
		s.tricks = [];
		s.shown = null;
		s.drawn = [];
		s.m.discards = [];
		s.foolGive = fool ? { from: fool.from === 'declarer' ? d : o, to: fool.from === 'declarer' ? o : d, options: [], card: fool.card } : null;
		s.result = null;
		s.payments = undefined;
		s.pi = w.game.plan.findIndex((e) => e.module === 'count');
		count.enter(w);
		s.pi = w.game.plan.findIndex((e) => e.module === 'result');
		result.enter(w);
		return w;
	};
	const pts = (w) => w.s.m.count.sidePoints[w.sides().of[w.s.declarer]] / 12;
	// 45 before the card, and the lone player is owed a plain card for the Fool the opponents hold: 45 + 1/2
	const owed = settled(['batons:2'], null);
	assert.equal(pts(owed), 45.5);
	assert.equal(owed.s.result.band.outcome, 'draw');
	assert.equal(owed.s.result.outcome, 'draw');
	// 46 before the card, and the lone player holds the Fool and pays a plain card: 45 + 1/2 after it
	const pays = settled(['batons:2'], { from: 'declarer', card: 'batons:3' }, ['batons:3']);
	assert.equal(pts(pays), 45.5);
	assert.equal(pays.s.result.band.outcome, 'draw');
	// 45 and no card owed or paid: the Onoranza is lost
	const plain = settled([], null);
	assert.equal(pts(plain), 45);
	assert.equal(plain.s.result.band.outcome, 'loss');
	assert.equal(plain.s.result.band.pays, 'onoranza_only');
	// 46 with no card to pay wins
	const win = settled(['batons:2', 'batons:3'], null);
	assert.equal(pts(win), 46);
	assert.equal(win.s.result.band.outcome, 'win');
});
