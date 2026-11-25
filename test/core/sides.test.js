// The sides live in the hand (a contract sets them, a called partner joins later) and the seat view of them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand } from '../../core/index.js';
import { load } from './helpers.js';

function until(h, id) {
	let guard = 0;
	while (h.s.phase !== id && !h.isOver()) {
		if (guard++ > 500) throw new Error('phase not reached: ' + id);
		const seat = h.toAct()[0];
		assert.ok(h.apply(seat, h.legal(seat)[0]).ok);
	}
	return h;
}

test('a contract sets the sides: the declarer alone against the rest, pooled', () => {
	const g = load('permesso_5', 5);
	assert.equal(g.sides.mode, 'by_contract');
	const h = until(newHand(g, { seed: 's1', dealer: 2 }), 'bidding');
	// before the contract the static map holds (everybody for himself)
	assert.equal(h.sides(), g.sides);
	const order = h.view(0).bidding.order;
	assert.equal(h.apply(order[0], { type: 'bid_one' }).ok, true);
	for (const q of order.slice(1)) assert.ok(h.apply(q, { type: 'pass' }).ok);
	assert.equal(h.s.declarer, order[0]);
	const sd = h.sides();
	assert.equal(sd.mode, 'declarer_vs_rest');
	assert.equal(sd.pool, 'side');
	assert.equal(sd.of[order[0]], 0);
	assert.equal(sd.of.filter((x) => x === 1).length, 4);
	for (let q = 0; q < 5; q++) assert.equal(h.view(q).sides.of[order[0]], 0);
});

test('a called partner is secret: the holder knows, the others know only the declarer and themselves', () => {
	const g = load('chiamare_il_re', 4);
	const h = until(newHand(g, { seed: 's2', dealer: 1 }), 'bidding');
	assert.ok(h.apply(1, { type: 'pass' }).ok);
	assert.equal(h.s.phase, 'call_partner');
	const call = h.legal(1)[0];
	assert.equal(call.type, 'call_partner');
	assert.ok(h.apply(1, call).ok);
	const holder = h.s.secret ? h.s.secret.holder : null;
	assert.notEqual(holder, null);
	assert.equal(h.sides().mode, 'called_partner');
	if (holder !== 1) {
		assert.equal(h.sides().of[holder], h.sides().of[1]);
		const own = h.view(holder).sides.of;
		assert.deepEqual(Object.values(own).filter((x) => x === 0).length, 2);
		assert.equal(Object.values(own).filter((x) => x === null).length, 0);
		// the declarer does not know who it is; a defender knows himself and the declarer
		const dv = h.view(1).sides.of;
		assert.equal(dv[1], 0);
		assert.equal(dv[holder], null);
		const other = [0, 1, 2, 3].find((q) => q !== 1 && q !== holder);
		const ov = h.view(other).sides.of;
		assert.equal(ov[other], 1);
		assert.equal(ov[1], 0);
		assert.equal(ov[holder], null);
	}
	// play on: once the called card is played, everybody knows
	let guard = 0;
	while (h.s.secret && !h.isOver() && guard++ < 400) {
		const seat = h.toAct()[0];
		assert.ok(h.apply(seat, h.legal(seat)[0]).ok);
	}
	assert.equal(h.s.secret, null);
	for (let q = 0; q < 4; q++) assert.equal(Object.values(h.view(q).sides.of).includes(null), false);
});

test('after the auction the contract is public; the laid and called cards are not yet there', () => {
	const g = load('permesso_3', 3);
	const h = until(newHand(g, { seed: 's3', dealer: 0 }), 'bidding');
	const order = h.view(0).bidding.order;
	h.apply(order[0], { type: 'bid_three' });
	for (const q of order.slice(1)) h.apply(q, { type: 'pass' });
	const v = h.view((order[0] + 1) % 3);
	assert.equal(v.contract.id, 'three');
	assert.equal(v.contract.laid, 0);
	assert.deepEqual(v.contract.called, []);
	assert.deepEqual(v.hand.slice().sort(), h.s.hands[(order[0] + 1) % 3].slice().sort());
});
