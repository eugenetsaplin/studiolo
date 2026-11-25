// The auction (order of speech, matching, passes), the throw-in and the match counting thrown-in hands.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, newMatch, replayHand } from '../../core/index.js';
import { load, playRandom } from './helpers.js';

// plays the first legal action of whoever acts until the phase `id` is reached
function until(h, id) {
	let guard = 0;
	while (h.s.phase !== id && !h.isOver()) {
		if (guard++ > 500) throw new Error('phase not reached: ' + id);
		const seat = h.toAct()[0];
		assert.ok(h.apply(seat, h.legal(seat)[0]).ok);
	}
	return h;
}
const types = (h, seat) => h.legal(seat).map((a) => a.type);
const act = (h, seat, type) => {
	assert.deepEqual(h.toAct(), [seat], 'whose turn: ' + type);
	const r = h.apply(seat, { type });
	assert.ok(r.ok, type + ' refused');
	return r;
};

test('the order of speech is dealer right first, dealer last; a later seat must bid higher, an earlier seat may match', () => {
	const g = load('permesso_3', 3);
	const h = until(newHand(g, { seed: 'a1', dealer: 0 }), 'bidding');
	assert.deepEqual(h.view(1).bidding.order, [1, 2, 0]);
	assert.deepEqual(h.toAct(), [1]);
	assert.deepEqual(types(h, 1), ['bid_three', 'bid_two', 'bid_one', 'bid_sans_prendre', 'pass']);
	act(h, 1, 'bid_two');
	assert.deepEqual(types(h, 2), ['bid_one', 'bid_sans_prendre', 'pass']);
	act(h, 2, 'bid_one');
	assert.deepEqual(types(h, 0), ['bid_sans_prendre', 'pass']);
	act(h, 0, 'pass');
	// seat 1 is earlier than the bidder of 'one': he may match it
	assert.deepEqual(h.toAct(), [1]);
	assert.deepEqual(types(h, 1), ['bid_one', 'bid_sans_prendre', 'pass']);
	act(h, 1, 'bid_one');
	// seat 2 is later now: higher only
	assert.deepEqual(types(h, 2), ['bid_sans_prendre', 'pass']);
	const r = act(h, 2, 'pass');
	assert.ok(r.events.some((e) => e.e === 'contract_won' && e.contract === 'one' && e.declarer === 1));
	assert.equal(h.s.contract, 'one');
	assert.equal(h.s.declarer, 1);
	assert.notEqual(h.s.phase, 'bidding');
	const v = h.view(0);
	assert.equal(v.contract.id, 'one');
	assert.equal(v.contract.declarer, 1);
	assert.equal(v.bidding.done, true);
});

test('a pass is final; the auction ends when all but the last bidder have passed', () => {
	const g = load('permesso_3', 3);
	const h = until(newHand(g, { seed: 'a2', dealer: 1 }), 'bidding');
	assert.deepEqual(h.view(2).bidding.order, [2, 0, 1]);
	act(h, 2, 'pass');
	act(h, 0, 'bid_three');
	assert.deepEqual(h.toAct(), [1]);
	act(h, 1, 'pass');
	assert.equal(h.s.contract, 'three');
	assert.equal(h.s.declarer, 0);
	assert.ok(h.view(2).bidding.bids.some((b) => b.seat === 2 && b.bid === 'pass'));
});

test('everybody passes: the hand is thrown in, nobody pays, the next dealer deals, the round of dealers goes on', () => {
	const g = load('permesso_3', 3);
	const m = newMatch(g, { seed: 'a3', firstDealer: 0 });
	const dealers = [];
	for (let i = 0; i < 3; i++) {
		const h = until(m.hand, 'bidding');
		dealers.push(h.s.dealer);
		const order = h.view(0).bidding.order;
		let last;
		for (const q of order) last = act(h, q, 'pass');
		assert.ok(last.events.some((e) => e.e === 'all_passed'));
		assert.ok(last.events.some((e) => e.e === 'thrown_in'));
		assert.ok(h.isOver());
		const r = h.result();
		assert.equal(r.outcome, 'thrown_in');
		assert.deepEqual(r.payments, []);
		assert.deepEqual(r.winners, []);
		assert.equal(h.view(0).result.outcome, 'thrown_in');
		if (i < 2) { assert.equal(m.isOver(), false); m.next(); }
	}
	// dealer_rounds 1: three thrown-in hands are the round of dealers
	assert.deepEqual(dealers, [0, 1, 2]);
	assert.equal(m.isOver(), true);
	const st = m.standing();
	assert.deepEqual(st.winners, []);
	assert.deepEqual(Object.values(st.totals), [0, 0, 0]);
});

test('the dealer speaks first; his pass ends the auction and he calls a king', () => {
	const g = load('chiamare_il_re', 4);
	const h = until(newHand(g, { seed: 'a4', dealer: 2 }), 'bidding');
	assert.deepEqual(h.view(0).bidding.order, [2, 3, 0, 1]);
	assert.deepEqual(h.toAct(), [2]);
	const r = act(h, 2, 'pass');
	assert.ok(r.events.some((e) => e.e === 'contract_won' && e.contract === 'call_king' && e.declarer === 2));
	assert.equal(h.s.declarer, 2);
	assert.equal(h.sides().mode, 'called_partner');
	assert.equal(h.s.phase, 'call_partner');
	assert.deepEqual(h.toAct(), [2]);
});

test('a bid of the dealer: the others may overcall it, and with a challenger a later seat may match it', () => {
	const g = load('chiamare_il_re', 4);
	const h = until(newHand(g, { seed: 'a5', dealer: 0 }), 'bidding');
	assert.deepEqual(types(h, 0), ['bid_one', 'bid_sans_prendre', 'pass']);
	act(h, 0, 'bid_one');
	assert.deepEqual(h.toAct(), [1]);
	assert.deepEqual(types(h, 1), ['bid_one', 'bid_sans_prendre', 'pass']);
	act(h, 1, 'bid_one');
	act(h, 2, 'pass');
	act(h, 3, 'pass');
	// the dealer is asked again: he is not the standing bidder, and may not match back (p. 82: let go or sans prendre)
	assert.deepEqual(h.toAct(), [0]);
	assert.deepEqual(types(h, 0), ['bid_sans_prendre', 'pass']);
	act(h, 0, 'pass');
	assert.equal(h.s.contract, 'one');
	assert.equal(h.s.declarer, 1);
});

test('a bid of the dealer that nobody overcalls stands; the sides are the declarer against the rest', () => {
	const g = load('chiamare_il_re', 4);
	const h = until(newHand(g, { seed: 'a6', dealer: 3 }), 'bidding');
	act(h, 3, 'bid_sans_prendre');
	act(h, 0, 'pass');
	act(h, 1, 'pass');
	act(h, 2, 'pass');
	assert.equal(h.s.contract, 'sans_prendre');
	assert.equal(h.s.declarer, 3);
	assert.equal(h.sides().mode, 'declarer_vs_rest');
	assert.deepEqual(h.sides().of, [1, 1, 1, 0]);
	assert.deepEqual(h.view(0).sides.of, { 0: 1, 1: 1, 2: 1, 3: 0 });
});

test('a phase that depends on the contract runs only for it', () => {
	const g = load('chiamare_il_re', 4);
	const h = until(newHand(g, { seed: 'a7', dealer: 0 }), 'bidding');
	act(h, 0, 'bid_one');
	for (const q of [1, 2, 3]) act(h, q, 'pass');
	const names = new Set();
	let guard = 0;
	while (!h.isOver() && guard++ < 400) { names.add(h.s.phase); const seat = h.toAct()[0]; assert.ok(h.apply(seat, h.legal(seat)[0]).ok); }
	assert.ok(!names.has('call_partner'));
	assert.ok(names.has('exchange'));
	// the alone settlement ran (declarer against each), not the pair one
	for (const p of h.s.result.payments) assert.equal(p.why, 'declarer_vs_each');
});

test('every hand of the contract games replays from its log to the same checksum', () => {
	for (const [id, n] of [['permesso_3', 3], ['permesso_5', 5], ['chiamare_il_re', 4], ['permesso_7', 7]]) {
		const g = load(id, n);
		for (let i = 0; i < 6; i++) {
			const h = playRandom(g, 'rp:' + i, i % n);
			const again = replayHand(g, { seed: 'rp:' + i, dealer: i % n }, h.s.log);
			assert.equal(again.checksum(), h.checksum(), id);
		}
	}
});

test('old games keep their snapshot: no new field appears while it is empty', () => {
	const g = load('venticinque', 2);
	const h = playRandom(g, 'old', 0);
	const keys = Object.keys(h.snapshot());
	for (const k of ['contract', 'declarer', 'sides', 'secret', 'allPassed']) assert.ok(!keys.includes(k), k);
});
