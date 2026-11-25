// Independent check of the contract games: the auction, the throw-in, the exchange (from_discard), calling the King
// (ladder, own King, reveal, the money of 2 against 2 and 1 against 3).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, newMatch, makeRng } from '../../core/index.js';
import { INFO } from '../../core/cards.js';
import { load, step, act, types, playUntil } from './lib.mjs';

const toPhase = (h, id) => playUntil(h, (x) => x.s.phase === id, 'ph:' + id);

test('at five: a later seat must bid higher, an earlier seat may match, a pass is final', () => {
	const g = load('permesso_5', 5);
	const h = toPhase(newHand(g, { seed: 'au5', dealer: 0 }), 'bidding');
	const order = h.view(0).bidding.order;
	assert.deepEqual(order, [1, 2, 3, 4, 0]);
	act(h, 1, 'bid_three');
	assert.ok(!types(h, 2).includes('bid_three'), 'later seat may not match');
	act(h, 2, 'pass');
	act(h, 3, 'bid_two');
	act(h, 4, 'pass');
	act(h, 0, 'pass');
	// seat 1 is earlier than 3: he may match «two"
	assert.deepEqual(h.toAct(), [1]);
	assert.ok(types(h, 1).includes('bid_two'));
	act(h, 1, 'bid_two');
	// seat 2 passed: never asked again; seat 3 must go higher
	assert.deepEqual(h.toAct(), [3]);
	assert.ok(!types(h, 3).includes('bid_two'));
	act(h, 3, 'pass');
	assert.equal(h.s.contract, 'two');
	assert.equal(h.s.declarer, 1);
});

test('four thrown-in hands end a permesso_4 match of one round of dealers; dealers rotate; nobody pays', () => {
	const g = load('permesso_4', 4);
	const m = newMatch(g, { seed: 'thr', firstDealer: 0 });
	const dealers = [];
	for (let i = 0; i < 4; i++) {
		const h = toPhase(m.hand, 'bidding');
		dealers.push(h.s.dealer);
		for (const q of h.view(0).bidding.order) act(h, q, 'pass');
		assert.equal(h.result().outcome, 'thrown_in');
		if (i < 3) { assert.equal(m.isOver(), false); m.next(); }
	}
	assert.equal(m.isOver(), true);
	assert.equal(new Set(dealers).size, 4);
	assert.deepEqual(Object.values(m.standing().ledger), [0, 0, 0, 0]);
});

test('Chiamare il Re: the dealer speaks first; his pass ends the auction and he calls a King', () => {
	const g = load('chiamare_il_re', 4);
	const h = toPhase(newHand(g, { seed: 'd7', dealer: 2 }), 'bidding');
	assert.deepEqual(h.toAct(), [2]);
	act(h, 2, 'pass');
	assert.equal(h.s.contract, 'call_king');
	assert.equal(h.s.declarer, 2);
	assert.equal(h.s.phase, 'call_partner');
	assert.deepEqual(h.toAct(), [2]);
	assert.ok(h.legal(2).every((a) => a.type === 'call_partner'));
});

test('with a challenger: the dealer bids «one», the next seat may match it and takes the bid («Ad una vado io»)', () => {
	const g = load('chiamare_il_re', 4);
	const h = toPhase(newHand(g, { seed: 'd7b', dealer: 0 }), 'bidding');
	act(h, 0, 'bid_one');
	const next = h.toAct()[0];
	assert.ok(types(h, next).includes('bid_one'));
	act(h, next, 'bid_one');
	assert.deepEqual(h.view(0).bidding.best, { seat: next, contract: 'one' });
	// the dealer may let him go or go sans prendre (p. 82)
	const back = [];
	while (h.s.phase === 'bidding' && h.toAct()[0] !== 0) { const q = h.toAct()[0]; back.push(q); act(h, q, 'pass'); }
	if (h.s.phase === 'bidding') {
		assert.ok(types(h, 0).includes('bid_sans_prendre'));
		act(h, 0, 'pass');
	}
	assert.equal(h.s.contract, 'one');
	assert.equal(h.s.declarer, next);
});

// a hand of Chiamare il Re at the call: the dealer passed
function atCall(seed, dealer = 0) {
	const g = load('chiamare_il_re', 4);
	const h = toPhase(newHand(g, { seed, dealer }), 'bidding');
	act(h, dealer, 'pass');
	return h;
}

test('the ladder: a Queen only when the caller holds every King (in his hand after the discard); never a card of his discard', () => {
	let stepped = 0;
	for (let i = 0; i < 1500 && stepped < 3; i++) {
		const h = atCall('lad:' + i);
		if (h.s.phase !== 'call_partner') continue;
		const known = new Set(h.s.hands[0]);
		const kings = Object.keys(INFO).filter((c) => !INFO[c].trump && INFO[c].rank === 'K');
		const cards = h.legal(0).map((a) => a.card);
		for (const c of cards) assert.ok(!h.s.discard[0].includes(c), 'not from his discard');
		if (kings.every((k) => known.has(k))) {
			stepped++;
			assert.ok(cards.every((c) => INFO[c].rank !== 'K'), 'no King once he holds all four');
		} else assert.ok(cards.every((c) => INFO[c].rank === 'K'));
	}
});

test('calling his own King: he plays alone, secret until the King is played, paid declarer against each', () => {
	let done = 0;
	for (let i = 0; i < 400 && done < 4; i++) {
		const h = atCall('own:' + i);
		if (h.s.phase !== 'call_partner') continue;
		const own = h.legal(0).find((a) => h.s.hands[0].includes(a.card));
		if (!own) continue;
		act(h, 0, 'call_partner', own.card);
		// the others see the declarer and themselves, nobody else
		for (const q of [1, 2, 3]) {
			const v = h.view(q);
			assert.equal(v.call.partner, null);
			for (const o of [1, 2, 3]) if (o !== q) assert.equal(v.sides.of[o], null, `seat ${q} must not know seat ${o}`);
		}
		const rng = makeRng('own' + i);
		let revealedAt = null;
		while (!h.isOver()) {
			const before = h.s.secret;
			const { seat, a, r } = step(h, rng);
			if (r.events.some((e) => e.e === 'partner_revealed')) {
				revealedAt = a.card;
				assert.equal(seat, 0);
				assert.equal(a.card, own.card);
			} else if (before && h.s.phase === 'tricks') assert.ok(h.s.secret, 'still secret');
		}
		assert.equal(revealedAt, own.card);
		const r = h.result();
		const pays = r.payments.filter((p) => p.why !== 'declaration');
		if (r.winners.length) {
			assert.equal(pays.length, 3, '1 against 3: three payments ' + JSON.stringify(pays));
			assert.ok(pays.every((p) => p.from === 0 || p.to === 0));
			assert.equal(new Set(pays.map((p) => p.amount)).size, 1);
		}
		done++;
	}
	assert.ok(done >= 2, 'own-King hands found: ' + done);
});

test('2 against 2: the partner is revealed by the called card; each winner is paid by one loser', () => {
	let done = 0;
	for (let i = 0; i < 200 && done < 10; i++) {
		const h = atCall('pair:' + i);
		if (h.s.phase !== 'call_partner') continue;
		const other = h.legal(0).find((a) => !h.s.hands[0].includes(a.card));
		if (!other) continue;
		act(h, 0, 'call_partner', other.card);
		const holder = [1, 2, 3].find((q) => h.s.hands[q].includes(other.card));
		assert.equal(h.view(holder).call.partner, holder);
		assert.equal(h.view(0).call.partner, null, 'the caller does not know his partner');
		for (const q of [1, 2, 3].filter((x) => x !== holder)) assert.equal(h.view(q).call.partner, null);
		const rng = makeRng('pair' + i);
		while (!h.isOver()) step(h, rng);
		assert.equal(h.view(1).call.partner, holder);
		const r = h.result();
		const pays = r.payments.filter((p) => p.why !== 'declaration');
		if (r.winners.length) {
			assert.equal(r.winners.length, 2);
			assert.ok(r.winners.includes(0) === r.winners.includes(holder), 'partners win together');
			assert.equal(pays.length, 2);
			for (const w of r.winners) assert.equal(pays.filter((p) => p.to === w).length, 1);
		}
		done++;
	}
	assert.ok(done >= 5);
});

test('the exchange never offers a King, the Angel (T20 under honours_4_angel) or the Bagatto to lay down; the Fool may be laid', () => {
	const g = load('permesso_3', 3);
	let fool = 0;
	for (let i = 0; i < 300; i++) {
		const h = toPhase(newHand(g, { seed: 'd12:' + i, dealer: 0 }), 'bidding');
		act(h, 1, 'bid_three'); act(h, 2, 'pass'); act(h, 0, 'pass');
		const lay = h.legal(1).filter((a) => a.type === 'lay_down').map((a) => a.card);
		const hand = h.s.hands[1];
		const honours = hand.filter((c) => c === 'T20' || c === 'T1' || (!INFO[c].trump && INFO[c].rank === 'K'));
		if (honours.length < hand.length) for (const c of honours) assert.ok(!lay.includes(c), 'honour offered: ' + c);
		if (hand.includes('T0')) { fool++; assert.ok(lay.includes('T0'), 'the Fool may be laid'); }
	}
	assert.ok(fool > 10);
});

test('the exchange and from_discard: holders take laid cards by the seed; a card of the dealer\'s discard comes from there', () => {
	const g = load('permesso_3', 3);
	let fromDiscard = 0;
	for (let i = 0; i < 400; i++) {
		const make = () => {
			const h = toPhase(newHand(g, { seed: 'd4:' + i, dealer: 0 }), 'bidding');
			act(h, 1, 'bid_three'); act(h, 2, 'pass'); act(h, 0, 'pass');
			for (let k = 0; k < 3; k++) act(h, 1, 'lay_down', h.legal(1)[0].card);
			return h;
		};
		const h = make();
		const laid = h.s.m.exchange.laid.slice();
		const disc = h.s.discard[0].slice();
		const calls = h.legal(1).map((a) => a.card);
		assert.ok(calls.every((c) => !h.s.hands[1].includes(c) && !laid.includes(c)), 'own or laid card offered');
		const pick = calls.filter((c) => disc.includes(c)).slice(0, 1).concat(calls.filter((c) => !disc.includes(c))).slice(0, 3);
		for (const c of pick) act(h, 1, 'call', c);
		const twin = make();
		for (const c of pick) act(twin, 1, 'call', c);
		assert.deepEqual(twin.s.hands, h.s.hands, 'the gifts follow the seed');
		for (const c of pick) assert.ok(h.s.hands[1].includes(c));
		if (disc.includes(pick[0])) {
			fromDiscard++;
			assert.ok(!h.s.discard[0].includes(pick[0]));
			assert.ok(h.s.discard[0].some((c) => laid.includes(c)), 'a laid card took its place');
		}
		for (const q of [0, 2]) {
			const got = h.view(q).exchange.mine.got;
			for (const c of got) assert.ok(laid.includes(c));
			assert.equal(got.length, h.view(q).exchange.mine.gave.length);
		}
	}
	assert.ok(fromDiscard > 0);
});

// FINDING (p. 82): after «Ad una vado io» the dealer either lets him go or answers «Io vado à sans prendre»; he does
// not match «one» back. The core lets the dealer and the challenger match «one» in turn without end.
test('challenger: after a seat matched the dealer\'s «one», the dealer may not match «one» back (p. 82)', () => {
	const g = load('chiamare_il_re', 4);
	const h = toPhase(newHand(g, { seed: 'pp', dealer: 0 }), 'bidding');
	act(h, 0, 'bid_one');
	act(h, 1, 'bid_one');
	act(h, 2, 'pass');
	act(h, 3, 'pass');
	assert.deepEqual(h.toAct(), [0]);
	assert.deepEqual(types(h, 0), ['bid_sans_prendre', 'pass']);
});
