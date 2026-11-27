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

// Torino 1787, p. 62: «A due», answered «subito»: second reading, the word returns at once to the seat that was overbid.
test('overbid_returns (alt): after «three» (seat 1) and «two» (seat 2) the word is with seat 1; the main value goes to the dealer as before', () => {
	const run = (alts) => {
		const h = until(newHand(load('permesso_3', 3, { alts }), { seed: 'three-then-two', dealer: 0 }), 'bidding');
		act(h, 1, 'bid_three');
		act(h, 2, 'bid_two');
		return h;
	};
	const main = run([]);
	assert.deepEqual(main.toAct(), [0]);
	const alt = run(['hand.phases[bidding].settings.overbid_returns']);
	assert.deepEqual(alt.toAct(), [1]);
	assert.deepEqual(types(alt, 1), ['bid_two', 'bid_one', 'bid_sans_prendre', 'pass']);
	// he holds with an equal bid: now seat 2 was overbid and has the word, he may only go higher
	act(alt, 1, 'bid_two');
	assert.deepEqual(alt.toAct(), [2]);
	assert.deepEqual(types(alt, 2), ['bid_one', 'bid_sans_prendre', 'pass']);
	// seat 2 gives way: the auction goes on with the dealer, who has not spoken
	act(alt, 2, 'pass');
	assert.deepEqual(alt.toAct(), [0]);
	act(alt, 0, 'pass');
	assert.equal(alt.s.contract, 'two');
	assert.equal(alt.s.declarer, 1);
	assert.equal(replayHand(alt.game, { seed: 'three-then-two', dealer: 0 }, alt.log).checksum(), alt.checksum());
});

test('overbid_returns is offered in every game that holds an auction, with the main value kept', () => {
	for (const [id, n] of [['permesso_3', 3], ['permesso_4', 4], ['permesso_5', 5], ['permesso_6', 6], ['permesso_7', 7], ['chiamare_il_re', 4]]) {
		const g = load(id, n);
		const bid = g.plan.find((e) => e.module === 'bidding');
		assert.equal(bid.set.overbid_returns, false, id);
		const g2 = load(id, n, { alts: ['hand.phases[bidding].settings.overbid_returns'] });
		assert.equal(g2.plan.find((e) => e.module === 'bidding').set.overbid_returns, true, id);
	}
});

test('chiamare_il_re, overbid_returns (alt): the dealer has the word at once after another player answers «ad una»', () => {
	const h = until(newHand(load('chiamare_il_re', 4, { alts: ['hand.phases[bidding].settings.overbid_returns'] }), { seed: 'k1', dealer: 0 }), 'bidding');
	act(h, 0, 'bid_one');
	const q = h.toAct()[0];
	assert.notEqual(q, 0);
	act(h, q, 'bid_one');
	assert.deepEqual(h.toAct(), [0]);
	assert.ok(types(h, 0).includes('bid_sans_prendre'));
});

// Torino 1787, p. 76-77: giuoco sciolto agreed beforehand: no auction, play begins at once, each for himself
test('sciolto_chosen: no auction at Sestilio and Settilio; the hand goes to the tricks, each for himself', () => {
	for (const [id, n] of [['permesso_6', 6], ['permesso_7', 7]]) {
		const g = load(id, n, { variant: 'sciolto_chosen' });
		const h = newHand(g, { seed: 'sc1', dealer: 0 });
		const phases = [h.s.phase];
		let guard = 0;
		while (!h.isOver() && guard++ < 1000) {
			const seat = h.toAct()[0];
			assert.ok(h.apply(seat, h.legal(seat)[0]).ok);
			if (phases[phases.length - 1] !== h.s.phase) phases.push(h.s.phase);
		}
		assert.ok(!phases.includes('bidding'), id + ' bids: ' + phases);
		assert.equal(h.s.contract, 'sciolto');
		assert.deepEqual(h.s.sides.of, Array.from({ length: n }, (_, i) => i));
		// six: 13 cards each and no discard; seven: 11 each and the card over is put away by the dealer (p. 77)
		assert.equal(phases.includes('discard'), n === 7, id);
		assert.ok(h.s.result.winners.length >= 1);
		const bidView = h.view(0).bidding;
		assert.equal(bidView.bids.length, 0);
	}
	// the other variant (a general pass leads to the free game) still bids
	const g2 = load('permesso_6', 6, { variant: 'all_pass_sciolto' });
	const h2 = until(newHand(g2, { seed: 'sc2', dealer: 0 }), 'bidding');
	assert.equal(h2.s.phase, 'bidding');
});

test('sciolto: the cards are counted by one, two or three as agreed (option group); Permesso itself stays in pairs', () => {
	for (const group of [1, 2, 3]) {
		const g = load('permesso_6', 6, { variant: 'sciolto_chosen', options: { group } });
		const h = newHand(g, { seed: 'g' + group, dealer: 1 });
		let guard = 0;
		while (!h.isOver() && guard++ < 1000) {
			const seat = h.toAct()[0];
			assert.ok(h.apply(seat, h.legal(seat)[0]).ok);
		}
		const total = Object.values(h.s.result.points).reduce((a, b) => a + b, 0);
		// one by one: every card of the pack is worth its value, 130 points; in pairs 91; in threes 78 short groups included
		if (group === 1) assert.equal(total, 130 * 12);
		if (group === 2) assert.equal(total, 91 * 12);
		assert.ok(total > 0);
	}
	const cnt = load('permesso_6', 6, { options: { group: 1 } }).plan.find((e) => e.module === 'count');
	assert.equal(cnt.set.group, 2);
});
