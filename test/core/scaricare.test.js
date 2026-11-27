// Sedici for three, «a scaricare» (Torino 1787, pp. 43-45): after the first «fuora» the other two play the hand out; the
// last to be out pays the first for both, the second to be out neither pays nor collects. The cards of the first to be
// out lie face down and are never shown to anybody. The plain game of three, and Sedici for two and four, are as before.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, replayHand } from '../../core/index.js';
import { build, checkConserved, load } from './helpers.js';
import { giveWon, livePoints, makeRng, targetOf } from './race-helpers.js';
import { chooseAction } from '../../bots/random.js';

const game = load('sedici_3', 3, { variant: 'a_scaricare' });
const plain = load('sedici_3', 3);

// dealer 0, so seat 1 leads; each seat holds four cards, `wants` first
function scene(g, wants = [[], [], []]) {
	const p = build([4, 4, 4], wants);
	return newHand(g, { seed: 'sc', dealer: 0, preset: p });
}

const claim = { type: 'claim_fuora' };
const net = (res) => {
	const o = { 0: 0, 1: 0, 2: 0 };
	for (const p of res.payments) { o[p.from] -= p.amount; o[p.to] += p.amount; }
	return o;
};

// plays at random, never claiming; in the last window everybody says no (pass_fuora). Stops when `until(h)` or at the end.
function drive(h, rng, until = () => false) {
	let guard = 0;
	while (!h.isOver() && !until(h)) {
		if (guard++ > 4000) throw new Error('the hand does not end');
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const pass = legal.find((a) => a.type === 'pass_fuora');
		const plays = legal.filter((a) => a.type === 'play');
		const a = pass || chooseAction(plays, rng);
		const r = h.apply(seat, a);
		if (!r.ok) throw new Error('refused ' + JSON.stringify(r));
	}
	return h;
}

test('the variant is supported and the file names the second reading of the empty pack', () => {
	assert.equal(game.support.runnable, true, JSON.stringify(game.support.missing));
	const f = game.hooks.tricks.find((e) => e.module === 'fuora').set;
	assert.equal(f.after_first_out, 'others_continue');
	assert.equal(f.stock_empty, 'others_pay_first');
	assert.equal(plain.hooks.tricks.find((e) => e.module === 'fuora').set.after_first_out, 'hand_ends');
});

test('the first «fuora» does not end the hand; his cards are hidden in every view, he has no action and no hand', () => {
	const h = scene(game);
	giveWon(h, 1, targetOf(game));
	const laid = h.s.hands[1].slice();
	assert.equal(laid.length, 4);
	assert.ok(h.legal(1).some((a) => a.type === 'claim_fuora'));
	const r = h.apply(1, claim);
	assert.ok(r.ok);
	assert.equal(h.isOver(), false);
	assert.deepEqual(h.toAct(), [2], 'the turn of the one who left goes to the next in the order of play');
	assert.deepEqual(h.legal(1), []);
	assert.equal(h.s.hands[1].length, 0);
	assert.equal(h.s.out.seat, 1);
	assert.deepEqual(h.s.outs.map((o) => o.seat), [1]);
	checkConserved(h);
	for (let q = 0; q < 3; q++) {
		const v = h.view(q);
		const text = JSON.stringify(v);
		for (const c of laid) assert.ok(!text.includes(`"${c}"`), `seat ${q} sees ${c}`);
		assert.deepEqual(v.hand.length, q === 1 ? 0 : 4);
		assert.equal(v.handCounts[1], 0);
		assert.deepEqual(v.fuora.out.map((o) => o.seat), [1]);
	}
	const ev = JSON.stringify(r.events) + JSON.stringify(h.log);
	for (const c of laid) assert.ok(!ev.includes(c), 'the events and the log name ' + c);
	assert.equal(h.apply(1, { type: 'play', card: laid[0] }).ok, false);
});

test('tricks of two cards; the next packets go to the two who play, the dealer stays', () => {
	const h = scene(game);
	giveWon(h, 1, targetOf(game));
	const restBefore = h.s.rest.length;
	assert.ok(h.apply(1, claim).ok);
	const rng = makeRng('two');
	let tricks = 0;
	while (h.s.round === 0) {
		const seat = h.toAct()[0];
		assert.notEqual(seat, 1);
		const before = h.s.tricks.length;
		const a = chooseAction(h.legal(seat).filter((x) => x.type === 'play'), rng);
		assert.ok(h.apply(seat, a).ok);
		if (h.s.tricks.length > before) {
			tricks++;
			assert.equal(h.s.tricks.at(-1).cards.length, 2);
			assert.ok(h.s.tricks.at(-1).cards.every((c) => c.seat !== 1));
		}
	}
	assert.equal(tricks, 4);
	assert.equal(h.s.round, 1);
	assert.deepEqual(h.s.hands.map((l) => l.length), [4, 0, 4]);
	assert.equal(h.s.rest.length, restBefore - 8);
	assert.equal(h.s.dealer, 0);
	assert.ok(!h.toAct().includes(1));
	assert.ok(h.toAct().length === 1);
	checkConserved(h);
});

test('the one who was to act leaves in the middle of a trick: the next in the order plays, and a trick of two cards is complete', () => {
	const h = scene(game);
	giveWon(h, 2, targetOf(game));
	const c1 = h.legal(1).find((a) => a.type === 'play');
	assert.ok(h.apply(1, c1).ok);
	assert.deepEqual(h.toAct(), [2]);
	assert.ok(h.apply(2, claim).ok);
	assert.equal(h.isOver(), false);
	assert.deepEqual(h.toAct(), [0], 'seat 2 was to act; seat 0 follows');
	assert.equal(h.s.trick.length, 1);
	assert.ok(h.apply(0, h.legal(0).find((a) => a.type === 'play')).ok);
	assert.equal(h.s.tricks.length, 1);
	assert.deepEqual(h.s.tricks[0].cards.map((c) => c.seat).sort(), [0, 1]);
	// he leaves as the third of a trick already two cards long: the trick is complete at once
	const g = scene(game);
	giveWon(g, 0, targetOf(game));
	assert.ok(g.apply(1, g.legal(1).find((a) => a.type === 'play')).ok);
	assert.ok(g.apply(2, g.legal(2).find((a) => a.type === 'play')).ok);
	assert.deepEqual(g.toAct(), [0]);
	assert.ok(g.apply(0, claim).ok);
	assert.equal(g.s.tricks.length, 1, 'the trick of seats 1 and 2 is counted');
	assert.equal(g.s.trick.length, 0);
	assert.deepEqual(g.toAct(), [g.s.tricks[0].winner]);
	assert.equal(g.isOver(), false);
	checkConserved(g);
});

test('the second «fuora» ends the hand: the last pays the first two stakes, the second pays nothing and collects nothing', () => {
	const h = scene(game);
	giveWon(h, 1, targetOf(game));
	giveWon(h, 2, targetOf(game));
	assert.ok(h.apply(1, claim).ok);
	assert.deepEqual(h.toAct(), [2]);
	const r = h.apply(2, claim);
	assert.ok(r.ok);
	assert.ok(h.isOver());
	const res = h.result();
	assert.deepEqual(res.winners, [1]);
	assert.deepEqual(res.worst, [0]);
	assert.deepEqual(res.order, [1, 2, 0]);
	assert.equal(res.reason, 'fuora');
	assert.deepEqual(net(res), { 0: -2, 1: 2, 2: 0 });
	assert.deepEqual(res.gamePoints, { 0: 0, 1: 1, 2: 0 });
	const text = JSON.stringify(res);
	for (const c of h.s.discard[1]) assert.ok(!text.includes(c));
	checkConserved(h);
});

test('the stake is the table stake: a stake of 5 makes the last pay ten', () => {
	const g = load('sedici_3', 3, { variant: 'a_scaricare', options: { stake: 5 } });
	const h = scene(g);
	giveWon(h, 1, targetOf(g));
	giveWon(h, 0, targetOf(g));
	assert.ok(h.apply(1, claim).ok);
	assert.ok(h.apply(2, h.legal(2).find((a) => a.type === 'play')).ok);
	assert.ok(h.apply(0, claim).ok);
	assert.deepEqual(net(h.result()), { 0: 0, 1: 10, 2: -10 });
});

test('the pack runs out and the second never says «fuora»: both pay the first one stake', () => {
	const h = scene(game);
	giveWon(h, 1, targetOf(game));
	assert.ok(h.apply(1, claim).ok);
	drive(h, makeRng('empty'), () => h.legal(h.toAct()[0] ?? 0).some((a) => a.type === 'pass_fuora'));
	// the last window is asked of the two who play, never of the one who is out
	const asked = [];
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		assert.ok(h.legal(seat).some((a) => a.type === 'pass_fuora'));
		asked.push(seat);
		assert.ok(h.apply(seat, { type: 'pass_fuora' }).ok);
	}
	assert.equal(asked.length, 2);
	assert.ok(!asked.includes(1));
	const res = h.result();
	assert.deepEqual(res.winners, [1]);
	assert.deepEqual(res.worst, []);
	assert.deepEqual(net(res), { 0: -1, 1: 2, 2: -1 });
	assert.equal(res.reason, 'fuora');
	assert.ok(h.s.stockEmpty);
	checkConserved(h);
});

test('in the last window the second may still say «fuora»: he is second, the one who said no is last', () => {
	const h = scene(game);
	giveWon(h, 1, targetOf(game));
	giveWon(h, 0, targetOf(game));
	giveWon(h, 2, targetOf(game));
	assert.ok(h.apply(1, claim).ok);
	// nobody claims on the way: the two play the pack out
	drive(h, makeRng('win2'), () => h.legal(h.toAct()[0] ?? 0).some((a) => a.type === 'pass_fuora'));
	assert.ok(!h.isOver());
	const first = h.toAct()[0];
	assert.ok(h.legal(first).some((a) => a.type === 'claim_fuora'));
	assert.ok(h.apply(first, { type: 'pass_fuora' }).ok);
	const second = h.toAct()[0];
	assert.notEqual(second, first);
	assert.ok(![1].includes(second));
	assert.ok(h.apply(second, claim).ok);
	assert.ok(h.isOver());
	const res = h.result();
	assert.deepEqual(res.order, [1, second, first]);
	assert.deepEqual(res.worst, [first]);
	assert.deepEqual(res.winners, [1]);
	assert.equal(net(res)[first], -2);
	assert.equal(net(res)[second], 0);
	assert.equal(net(res)[1], 2);
});

test('the plain game of three is as before: the first «fuora» ends the hand and both pay', () => {
	const h = scene(plain);
	giveWon(h, 1, targetOf(plain));
	assert.ok(h.apply(1, claim).ok);
	assert.ok(h.isOver());
	assert.deepEqual(net(h.result()), { 0: -1, 1: 2, 2: -1 });
	assert.equal(h.s.outs.length, 0);
	assert.equal(h.result().order, undefined);
	assert.equal(JSON.stringify(h.view(0).fuora).includes('"out"'), false);
});

test('a false «fuora» is still paid and play goes on, with the first already out', () => {
	const h = scene(game);
	giveWon(h, 1, targetOf(game));
	assert.ok(h.apply(1, claim).ok);
	assert.ok(h.legal(2).some((a) => a.type === 'claim_fuora'));
	assert.ok(h.apply(2, claim).ok);
	assert.equal(h.isOver(), false, 'a false claim does not end the hand');
	assert.deepEqual(h.s.outs.map((o) => o.seat), [1]);
	assert.equal(h.s.hands[2].length, 4);
});

test('two hundred hands of the variant played by random players end, with the cards kept', () => {
	let withSecond = 0;
	let emptyPack = 0;
	let nobody = 0;
	for (let i = 0; i < 200; i++) {
		const h = newHand(game, { seed: 'two-hundred-' + i, dealer: i % 3 });
		const rng = makeRng('r' + i);
		let guard = 0;
		while (!h.isOver()) {
			if (guard++ > 4000) throw new Error('no end ' + i);
			const seat = h.toAct()[0];
			const legal = h.legal(seat);
			const right = legal.find((a) => a.type === 'claim_fuora' && livePoints(h, seat) >= targetOf(game));
			const a = right || chooseAction(legal.filter((x) => x.type !== 'claim_fuora'), rng) || legal[0];
			assert.ok(h.apply(seat, a).ok);
		}
		checkConserved(h);
		assert.equal(replayHand(game, { seed: 'two-hundred-' + i, dealer: i % 3 }, h.log).checksum(), h.checksum());
		const res = h.result();
		if (res.order && res.order.length === 3) withSecond++;
		else if (res.winners.length) emptyPack++;
		else nobody++;
		if (res.winners.length) {
			const n = net(res);
			assert.equal(n[0] + n[1] + n[2], 0);
		}
	}
	assert.equal(withSecond + emptyPack + nobody, 200);
	assert.ok(withSecond > 0, 'some hands reach a second «fuora»');
	if (process.env.SCARICARE_COUNTS) console.log('hands: second out', withSecond, 'pack ran out after the first', emptyPack, 'nobody out', nobody);
});
