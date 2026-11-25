#!/usr/bin/env node
// Is the deal fair? Deal many hands of one game and look, right after the deal, at where every card of the pack lies: in the
// hand of a seat or outside the hands (the undealt cards, a stock, a dead pile). A shuffle and a deal with no bias put a card in
// a place with the probability (cards in that place) / (cards of the pack), the same for every card; the check compares the
// counts of the series with that.
//
//   node tools/deal-check.mjs <game> --seats N [--variant V] [--deals 100000] [--seed S] [--workers W] [--json]
//
// Deal H of the series has the seed <S>:<game>:<seats>[:<variant>]:<H>, as in tools/play.mjs, and its dealer is H mod seats.
// Two tables are made from the same deals: places by seat number (the dealer in turn), and places relative to the dealer
// (d is the dealer, d+1 the seat to the right of the dealer, d+2 the next, ...). A bias tied to the dealer shows in the
// second table and washes out in the first. The last column of a table is "out": not in any hand.
//
// The numbers (see analyze()):
//   - expected share of a place: the mean number of cards in the place over the deals, divided by the pack. A dealer who is
//     dealt more cards than the others has a larger share, and the expectation takes it in.
//   - chi-square of the table (cards x places), Pearson: sum of (observed - expected)^2 / expected over the cells, with
//     degrees of freedom = sum over cards of (places that can hold the card - 1). The probability is the upper tail
//     P(X >= x) of the chi-square distribution, from the regularised upper incomplete gamma function Q(df/2, x/2):
//     the series for x/2 < df/2 + 1, the continued fraction (modified Lentz) otherwise (Numerical Recipes, section 6.2);
//     log-gamma by the Lanczos approximation. The cards of one deal are not independent of each other (a place holds a
//     fixed number of them), so the table is only close to a chi-square table; and in the table by seat number, where the
//     dealer's place changes from deal to deal, the cells vary a little less than the formula says, so its probability errs
//     towards 1 ("no bias found").
//     A place also holds a fixed number of cards in every deal. With this second tie the statistic of a pack of D cards
//     and k places follows D/(D-1) times a chi-square with (D-1)(k-1) degrees of freedom, not one with D(k-1). The mean is
//     the same and the tail a little heavier: the probability printed here differs from that one by at most a tenth of
//     its value (checked on 400 seeds against an exact tail).
//   - the standardised deviation of one cell: (observed - expected) / sd, where the sd is that of a sum of independent 0/1
//     draws with the chance (cards in the place in this deal) / (pack). The normal distribution gives the share of cells
//     expected beyond 3 sigma (two-sided, 0.0027).
// The same seed prints the same bytes at any number of workers: a worker returns whole-number counts, and sums of whole
// numbers do not depend on the order. No clock, no random numbers.
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { newHand } from '../core/index.js';
import { tableGame, gameKey } from './botlab/table.mjs';
import { SolverError } from './botlab/solver.mjs';

// ---- the counting part: pure, takes any source of deals ----------------------------------------------------------------

// A deal is {dealer, where}: where[i] is the seat that holds card i of the pack (a list of the card ids), or -1 for out of
// the hands. A source is an iterable of deals.
export function newTally(cards, seats) {
	const cols = seats + 1;
	const grp = () => ({ counts: new Float64Array(cards * cols), size: new Float64Array(cols), sizeSq: new Float64Array(cols) });
	return { cards, seats, deals: 0, bySeat: grp(), byDealer: grp() };
}

export function addDeal(t, deal) {
	const n = t.seats;
	const sizes = [new Array(n + 1).fill(0), new Array(n + 1).fill(0)];
	for (let i = 0; i < t.cards; i++) {
		const s = deal.where[i];
		const a = s < 0 ? n : s;
		const b = s < 0 ? n : (s - deal.dealer + n) % n;
		t.bySeat.counts[i * (n + 1) + a]++;
		t.byDealer.counts[i * (n + 1) + b]++;
		sizes[0][a]++;
		sizes[1][b]++;
	}
	[t.bySeat, t.byDealer].forEach((g, k) => { for (let c = 0; c <= n; c++) { g.size[c] += sizes[k][c]; g.sizeSq[c] += sizes[k][c] * sizes[k][c]; } });
	t.deals++;
}

export function mergeTally(a, b) {
	for (const k of ['bySeat', 'byDealer']) for (const f of ['counts', 'size', 'sizeSq']) for (let i = 0; i < a[k][f].length; i++) a[k][f][i] += b[k][f][i];
	a.deals += b.deals;
	return a;
}

export function tallyOf(cards, seats, source) {
	const t = newTally(cards, seats);
	for (const d of source) addDeal(t, d);
	return t;
}

// ---- distributions -----------------------------------------------------------------------------------------------------

function lnGamma(x) { // Lanczos, g = 7
	const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
	if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
	x -= 1;
	let a = c[0];
	const t = x + 7.5;
	for (let i = 1; i < 9; i++) a += c[i] / (x + i);
	return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// Q(a, x): the regularised upper incomplete gamma function
export function gammaQ(a, x) {
	if (x <= 0) return 1;
	if (x < a + 1) { // series for P, then 1 - P
		let ap = a, sum = 1 / a, del = sum;
		for (let n = 0; n < 10000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
		return Math.max(0, 1 - sum * Math.exp(-x + a * Math.log(x) - lnGamma(a)));
	}
	const tiny = 1e-300;
	let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
	for (let i = 1; i < 10000; i++) {
		const an = -i * (i - a);
		b += 2;
		d = an * d + b; if (Math.abs(d) < tiny) d = tiny;
		c = b + an / c; if (Math.abs(c) < tiny) c = tiny;
		d = 1 / d;
		const del = d * c;
		h *= del;
		if (Math.abs(del - 1) < 1e-15) break;
	}
	return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}
export const chiSquareTail = (x, df) => (df <= 0 ? 1 : gammaQ(df / 2, x / 2));

// erfc: a series for small x, a continued fraction of the tail for large x. Two-sided normal tail beyond z sigma.
function erfc(x) {
	if (x < 0) return 2 - erfc(-x);
	if (x < 2.5) { let sum = x, term = x; for (let n = 1; n < 200; n++) { term *= -x * x / n; const add = term / (2 * n + 1); sum += add; if (Math.abs(add) < 1e-17) break; } return 1 - 2 / Math.sqrt(Math.PI) * sum; }
	let f = 0;
	for (let k = 60; k >= 1; k--) f = k / 2 / (x + f);
	return Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
}
export const normalTwoSided = (z) => erfc(Math.abs(z) / Math.SQRT2);

// ---- the report --------------------------------------------------------------------------------------------------------

export function analyze(t, cardIds) {
	const n = t.seats, cols = n + 1, D = t.cards, N = t.deals;
	const out = {};
	const sigmaLimit = 3;
	const p3 = normalTwoSided(sigmaLimit);
	for (const [name, g] of [['bySeat', t.bySeat], ['byDealer', t.byDealer]]) {
		const names = name === 'bySeat' ? Array.from({ length: n }, (_, s) => 'seat ' + s) : Array.from({ length: n }, (_, k) => (k === 0 ? 'dealer' : 'dealer+' + k));
		names.push('out');
		// the expected count of a card in a place: the sum over the deals of (cards in the place) / pack; its variance: the sum of p(1-p)
		const exp = new Float64Array(cols), vr = new Float64Array(cols);
		for (let c = 0; c < cols; c++) { exp[c] = g.size[c] / D; vr[c] = g.size[c] / D - g.sizeSq[c] / (D * D); }
		let chi = 0, df = 0, cells = 0, big = 0, zMax = 0, zCard = null, zCol = null;
		const lo = new Array(cols).fill(Infinity), hi = new Array(cols).fill(-Infinity), loC = new Array(cols).fill(null), hiC = new Array(cols).fill(null);
		for (let i = 0; i < D; i++) {
			let live = 0;
			for (let c = 0; c < cols; c++) {
				const o = g.counts[i * cols + c];
				const share = o / N;
				if (exp[c] <= 0) continue; // a place that never holds a card (no card lies out of the hands)
				if (share < lo[c]) { lo[c] = share; loC[c] = cardIds[i]; }
				if (share > hi[c]) { hi[c] = share; hiC[c] = cardIds[i]; }
				live++;
				chi += (o - exp[c]) ** 2 / exp[c];
				if (vr[c] > 1e-12) {
					cells++;
					const z = (o - exp[c]) / Math.sqrt(vr[c]);
					if (Math.abs(z) > sigmaLimit) big++;
					if (Math.abs(z) > Math.abs(zMax)) { zMax = z; zCard = cardIds[i]; zCol = names[c]; }
				}
			}
			df += live - 1;
		}
		out[name] = {
			places: names.map((nm, c) => exp[c] <= 0 ? null : { place: nm, expectedShare: exp[c] / N, minShare: lo[c], minCard: loC[c], maxShare: hi[c], maxCard: hiC[c] }).filter(Boolean),
			chiSquare: chi, df, p: chiSquareTail(chi, df),
			maxZ: zMax, maxZCard: zCard, maxZPlace: zCol, cells, beyond3: big, expectedBeyond3: cells * p3,
		};
	}
	return { deals: N, cards: D, seats: n, ...out };
}

// ---- the deals of a game -----------------------------------------------------------------------------------------------

function cardsOf(snap) {
	const ids = new Set();
	for (const l of Object.values(snap.hands)) l.forEach((c) => ids.add(c));
	for (const c of snap.rest) ids.add(c);
	for (const l of Object.values(snap.discard ?? {})) l.forEach((c) => ids.add(c));
	for (const c of snap.stock ?? []) ids.add(typeof c === 'string' ? c : c.card);
	return [...ids].sort();
}

export function* dealsOfGame(spec, from, to, deck) {
	const game = tableGame(spec.game, spec.seats, spec.variant);
	const key = gameKey(spec.game, spec.seats, spec.variant);
	const idx = new Map(deck.map((c, i) => [c, i]));
	for (let h = from; h < to; h++) {
		const dealer = h % spec.seats;
		const snap = newHand(game, { seed: `${spec.seed}:${key}:${h}`, dealer }).snapshot();
		if (cardsOf(snap).length !== deck.length) throw new SolverError(`deal ${h}: the pack changes from deal to deal`);
		const where = new Array(deck.length).fill(-1);
		for (const [s, list] of Object.entries(snap.hands)) {
			for (const c of list) {
				const i = idx.get(c);
				if (i === undefined) throw new SolverError(`deal ${h}: card ${c} is not in the pack of deal 0`);
				where[i] = Number(s);
			}
		}
		yield { dealer, where };
	}
}

export function deckOf(spec) {
	const game = tableGame(spec.game, spec.seats, spec.variant);
	return cardsOf(newHand(game, { seed: `${spec.seed}:${gameKey(spec.game, spec.seats, spec.variant)}:0`, dealer: 0 }).snapshot());
}

const GROUPS = ['bySeat', 'byDealer'];
const FIELDS = ['counts', 'size', 'sizeSq'];
const plain = (t) => { const r = { ...t }; for (const k of GROUPS) { r[k] = {}; for (const f of FIELDS) r[k][f] = [...t[k][f]]; } return r; };
const typed = (t) => { for (const k of GROUPS) for (const f of FIELDS) t[k][f] = Float64Array.from(t[k][f]); return t; };

if (!isMainThread && workerData?.dealCheck) {
	const { spec, from, to, deck } = workerData;
	parentPort.postMessage(plain(tallyOf(deck.length, spec.seats, dealsOfGame(spec, from, to, deck))));
}

export async function runSeries(spec, deals, workers) {
	const deck = deckOf(spec);
	const w = Math.max(1, Math.min(workers, deals));
	const parts = [];
	for (let k = 0; k < w; k++) parts.push([Math.floor(deals * k / w), Math.floor(deals * (k + 1) / w)]);
	const tallies = await Promise.all(parts.map(([from, to]) => new Promise((resolve, reject) => {
		if (w === 1) { resolve(tallyOf(deck.length, spec.seats, dealsOfGame(spec, from, to, deck))); return; }
		const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { dealCheck: true, spec, from, to, deck } });
		wk.once('message', (m) => resolve(typed(m)));
		wk.once('error', reject);
	})));
	return { deck, tally: tallies.reduce((a, b) => mergeTally(a, b)) };
}

// ---- printing ----------------------------------------------------------------------------------------------------------

const f4 = (x) => x.toFixed(4);
const f2 = (x) => x.toFixed(2);
const sci = (p) => (p >= 0.0001 ? p.toFixed(4) : p === 0 ? '< 1e-300' : p.toExponential(2));

export function format(spec, rep) {
	const L = [];
	L.push(`game ${spec.game}, ${spec.seats} seats${spec.variant ? ', variant ' + spec.variant : ''}, ${rep.deals} deals, seed ${spec.seed}, pack of ${rep.cards} cards`);
	for (const [name, title] of [['bySeat', 'places by seat number (the dealer turns by deal number)'], ['byDealer', 'places relative to the dealer (d+1 is the seat to the right of the dealer)']]) {
		const r = rep[name];
		L.push('');
		L.push(title);
		L.push('place     expected  lowest [card]       highest [card]');
		for (const p of r.places) L.push(`${p.place.padEnd(10)}${f4(p.expectedShare)}    ${f4(p.minShare)} [${p.minCard}]`.padEnd(46) + `${f4(p.maxShare)} [${p.maxCard}]`);
		L.push(`chi-square ${f2(r.chiSquare)}, ${r.df} degrees of freedom, probability of this or more with a fair deal ${sci(r.p)}`);
		L.push(`largest single cell: z ${f2(r.maxZ)} (${r.maxZCard}, ${r.maxZPlace}); cells beyond 3 sigma: ${r.beyond3} of ${r.cells}, expected ${f2(r.expectedBeyond3)}`);
	}
	return L.join('\n');
}

export function toJson(spec, rep) {
	const r6 = (x) => Math.round(x * 1e6) / 1e6;
	const grp = (r) => ({
		places: r.places.map((p) => ({ ...p, expectedShare: r6(p.expectedShare), minShare: r6(p.minShare), maxShare: r6(p.maxShare) })),
		chiSquare: r6(r.chiSquare), df: r.df, p: Number(r.p.toPrecision(4)), maxZ: r6(r.maxZ), maxZCard: r.maxZCard, maxZPlace: r.maxZPlace,
		cells: r.cells, beyond3: r.beyond3, expectedBeyond3: r6(r.expectedBeyond3),
	});
	return { game: spec.game, seats: spec.seats, variant: spec.variant, seed: spec.seed, deals: rep.deals, cards: rep.cards, bySeat: grp(rep.bySeat), byDealer: grp(rep.byDealer) };
}

export function parseArgs(argv) {
	const o = { game: null, json: false };
	const kv = {};
	for (let i = 0; i < argv.length; i++) {
		const t = argv[i];
		if (t === '--json') o.json = true;
		else if (['--seats', '--variant', '--deals', '--seed', '--workers'].includes(t)) {
			if (argv[i + 1] === undefined) throw new SolverError(`${t} needs a value`);
			kv[t.slice(2)] = argv[++i];
		} else if (t.startsWith('--')) throw new SolverError(`unknown option ${t}`);
		else if (o.game === null) o.game = t;
		else throw new SolverError(`unexpected argument ${t}`);
	}
	if (!o.game) throw new SolverError('usage: node tools/deal-check.mjs <game> --seats N [--variant V] [--deals 100000] [--seed S] [--workers W] [--json]');
	const num = (k, d, min) => {
		if (kv[k] === undefined) return d;
		const x = Number(kv[k]);
		if (!Number.isInteger(x) || x < min) throw new SolverError(`--${k} must be an integer >= ${min}`);
		return x;
	};
	o.seats = num('seats', null, 1);
	if (o.seats === null) throw new SolverError('--seats N is needed');
	o.variant = kv.variant ?? null;
	o.seed = kv.seed ?? 'deal';
	o.deals = num('deals', 100000, 1);
	o.workers = num('workers', Math.max(1, Math.min(4, os.availableParallelism() - 2)), 1);
	return o;
}

export async function main(argv, out = (s) => process.stdout.write(s + '\n')) {
	const o = parseArgs(argv);
	const spec = { game: o.game, seats: o.seats, variant: o.variant, seed: o.seed };
	tableGame(o.game, o.seats, o.variant); // a bad game, seat count or variant stops here with the core's message
	const { deck, tally } = await runSeries(spec, o.deals, o.workers);
	const rep = analyze(tally, deck);
	out(o.json ? JSON.stringify(toJson(spec, rep)) : format(spec, rep));
}

if (isMainThread && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try { await main(process.argv.slice(2)); } catch (e) {
		if (!(e instanceof SolverError)) throw e;
		console.error('deal-check: ' + e.message);
		process.exitCode = 1;
	}
}
