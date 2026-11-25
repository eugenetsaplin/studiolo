// tools/deal-check.mjs: the numbers repeat, the counting part tells a deal that favours the dealer from a fair one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { main, tallyOf, analyze, gammaQ, chiSquareTail, normalTwoSided } from '../../tools/deal-check.mjs';

async function run(args) {
	const lines = [];
	await main(args, (s) => lines.push(s));
	return lines.join('\n') + '\n';
}

// a small deterministic generator (mulberry32) for the made-up sources of deals
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6D2B79F5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// A made-up source: a pack of 40 cards, 5 cards to each of 3 seats, the rest out; the dealer turns. With `favour` > 0 the card 0
// goes to the dealer with that extra chance when it did not fall there by itself.
function* source({ seed, deals, favour = 0 }) {
	const r = rng(seed);
	const D = 40, seats = 3, hand = 5;
	for (let h = 0; h < deals; h++) {
		const order = Array.from({ length: D }, (_, i) => i);
		for (let i = D - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
		const dealer = h % seats;
		const where = new Array(D).fill(-1);
		order.slice(0, seats * hand).forEach((card, k) => { where[card] = k % seats; });
		if (favour > 0 && where[0] !== dealer && r() < favour) {
			const mine = where.findIndex((s, i) => s === dealer && i !== 0);
			if (where[0] === -1) { where[0] = dealer; where[mine] = -1; } else { const other = where[0]; where[0] = dealer; where[mine] = other; }
		}
		yield { dealer, where };
	}
}
const ids = Array.from({ length: 40 }, (_, i) => 'c' + i);

test('the distribution functions give known values', () => {
	assert.ok(Math.abs(chiSquareTail(3.841458820694124, 1) - 0.05) < 1e-9);
	assert.ok(Math.abs(chiSquareTail(18.307038053275146, 10) - 0.05) < 1e-9);
	assert.ok(Math.abs(chiSquareTail(124.34211340400407, 100) - 0.05) < 1e-8);
	assert.ok(Math.abs(gammaQ(1, 2) - Math.exp(-2)) < 1e-12);
	assert.ok(Math.abs(normalTwoSided(3) - 0.0026997960632601) < 1e-12);
	assert.ok(Math.abs(normalTwoSided(1.959963984540054) - 0.05) < 1e-12);
});

test('a fair made-up source is not rejected, a source that favours the dealer is', () => {
	const fair = analyze(tallyOf(40, 3, source({ seed: 7, deals: 20000 })), ids);
	assert.ok(fair.byDealer.p > 0.001, `fair deal: p = ${fair.byDealer.p}`);
	assert.ok(fair.bySeat.p > 0.001, `fair deal, by seat: p = ${fair.bySeat.p}`);
	const biased = analyze(tallyOf(40, 3, source({ seed: 7, deals: 20000, favour: 0.05 })), ids);
	assert.ok(biased.byDealer.p < 0.001, `biased deal: p = ${biased.byDealer.p}`);
	assert.equal(biased.byDealer.maxZCard, 'c0');
	assert.equal(biased.byDealer.maxZPlace, 'dealer');
	assert.ok(biased.byDealer.maxZ > 5);
	// the expected shares: 5 of 40 cards to each seat, 25 out
	assert.ok(Math.abs(fair.byDealer.places[0].expectedShare - 5 / 40) < 1e-12);
	assert.ok(Math.abs(fair.byDealer.places[3].expectedShare - 25 / 40) < 1e-12);
});

test('a game: the same seed, the same bytes, at one worker and at three; --json has the same numbers', async () => {
	const args = ['sedici_2', '--seats', '2', '--deals', '3000', '--seed', 'fair'];
	const one = await run([...args, '--workers', '1']);
	assert.equal(await run([...args, '--workers', '3']), one);
	assert.equal(await run([...args, '--workers', '1']), one);
	assert.match(one, /^game sedici_2, 2 seats, 3000 deals, seed fair, pack of 78 cards\n/);
	assert.notEqual(await run(['sedici_2', '--seats', '2', '--deals', '3000', '--seed', 'other']), one);
	const j = JSON.parse(await run([...args, '--json', '--workers', '2']));
	assert.equal(j.deals, 3000);
	assert.equal(j.bySeat.df, 156);
	assert.ok(j.byDealer.p > 0.001 && j.bySeat.p > 0.001, 'a fair deal is not rejected');
	assert.ok(one.includes(`chi-square ${j.bySeat.chiSquare.toFixed(2)}, 156 degrees`));
});

test('the dealer who is dealt more cards has the larger expected share', async () => {
	const j = JSON.parse(await run(['venticinque', '--seats', '2', '--deals', '2000', '--seed', 'fair', '--json']));
	const [d, d1, out] = j.byDealer.places;
	assert.equal(d.place, 'dealer');
	assert.ok(Math.abs(d.expectedShare - 28 / 78) < 1e-4 && Math.abs(d1.expectedShare - 25 / 78) < 1e-4 && Math.abs(out.expectedShare - 25 / 78) < 1e-4);
});

test('bad arguments stop with a message', async () => {
	await assert.rejects(run(['sedici_2']), /--seats N is needed/);
	await assert.rejects(run(['sedici_2', '--seats', '2', '--bogus']), /unknown option/);
});
