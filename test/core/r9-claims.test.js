// R9 a10 and a11: fuora claim_when own_turn, tricks first_leader round_last_taker.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { load, loadPatched } from './helpers.js';
import { scene, giveWon } from './race-helpers.js';

const patchFuora = (value) => (f) => { f.hand.phases.find((p) => p.id === 'fuora').settings.claim_when.value = value; };
const ownTurn = loadPatched('sedici_2', 2, patchFuora('own_turn'));
// revision 9: the file itself says own_turn; after_trick is the alt, patched in here
const afterTrick = loadPatched('sedici_2', 2, patchFuora('after_trick'));
const claims = (h, seat) => h.legal(seat).filter((a) => a.type === 'claim_fuora');

test('a10: own_turn is played by the core', () => {
	assert.equal(ownTurn.support.runnable, true);
	assert.equal(load('sedici_2', 2).rules.hand.phases.find((p) => p.id === 'fuora').settings.claim_when.value, 'own_turn');
});

test('a10: the seat that reached the target claims in the middle of a trick, wins, and the table cards count for nobody', () => {
	const h = scene(ownTurn, 'swords:5', 'swords:2');
	giveWon(h, 0, 16);
	assert.deepEqual(claims(h, 0), [], 'it is not seat 0 turn yet');
	assert.deepEqual(claims(h, 1), [{ type: 'claim_fuora' }], 'seat 1 may claim before its lead');
	assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.deepEqual(claims(h, 1), []);
	assert.deepEqual(claims(h, 0), [{ type: 'claim_fuora' }], 'in the middle of a trick, before the answer');
	assert.equal(h.view(0).fuora.canClaim, true);
	const r = h.apply(0, { type: 'claim_fuora' });
	assert.ok(r.ok);
	assert.deepEqual(r.events.find((e) => e.e === 'fuora_claimed'), { e: 'fuora_claimed', seat: 0, valid: true, points: 16 });
	assert.ok(h.isOver());
	const res = h.result();
	assert.deepEqual(res.winners, [0]);
	assert.equal(res.reason, 'fuora');
	assert.equal(res.points[1], 0, 'the card lying on the table is nobody\'s');
	assert.equal(res.points[0] / 12, 16);
});

test('a10: a seat below the target gets a false claim by the rows; one claim a turn; play goes on', () => {
	const h = scene(ownTurn, 'swords:5', 'swords:2');
	const r = h.apply(1, { type: 'claim_fuora' });
	assert.ok(r.ok);
	assert.equal(r.events.find((e) => e.e === 'fuora_claimed').valid, false);
	assert.ok(!h.isOver());
	assert.deepEqual(claims(h, 1), [], 'not twice in a turn');
	assert.deepEqual(h.toAct(), [1]);
	assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.deepEqual(claims(h, 0), [{ type: 'claim_fuora' }]);
	const rows = h.s.m.fuora.claims;
	assert.deepEqual(rows.map((c) => [c.seat, c.valid, c.stake]), [[1, false, 'marcia']]);
});

test('a10: with after_trick nothing changes: no claim in the middle of a trick', () => {
	const h = scene(afterTrick, 'swords:5', 'swords:2');
	giveWon(h, 0, 16);
	assert.deepEqual(claims(h, 1), []);
	assert.ok(h.apply(1, { type: 'play', card: 'swords:5' }).ok);
	assert.deepEqual(claims(h, 0), []);
	assert.equal(h.apply(0, { type: 'claim_fuora' }).ok, false);
});

test('a11: round_last_taker: a new hand starts on the dealer\'s right, each later round with the last taker', () => {
	const game = loadPatched('sedici_2', 2, (f) => { f.hand.phases.find((p) => p.id === 'rounds').phases.find((p) => p.id === 'tricks').settings.first_leader.value = 'round_last_taker'; });
	assert.equal(game.support.runnable, true);
	const per = game.plan.find((e) => e.module === 'deal').set.hand_size;
	const rng = makeRng('r9-a11');
	const m = newMatch(game, { seed: 'r9-a11', firstDealer: 0 });
	let hands = 0;
	let later = 0;
	for (let k = 0; k < 3; k++) {
		const h = m.hand;
		while (!h.isOver()) {
			const seat = h.toAct()[0];
			const all = h.legal(seat);
			const plain = all.filter((x) => x.type !== 'claim_fuora');
			const a = chooseAction(plain.length ? plain : all, rng); // a claim only when the table waits for it
			assert.ok(h.apply(seat, a).ok);
		}
		hands++;
		const n = h.s.n;
		h.s.tricks.forEach((t, i) => {
			if (i % per !== 0) return;
			if (i === 0) assert.equal(t.leader, (h.s.dealer + 1) % n, `hand ${k}: the first round starts on the dealer's right`);
			else { later++; assert.equal(t.leader, h.s.tricks[i - 1].winner, `hand ${k}, trick ${i}: the taker of the last trick leads`); }
		});
		if (m.isOver()) break;
		m.next();
	}
	assert.equal(hands, 3);
	assert.ok(later >= 3, "rounds after the first were played: " + later);
});
