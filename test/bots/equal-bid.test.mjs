// Revision 11, the outside report (section 3): in Permesso an earlier seat may answer «a due anch'io», a bid equal to the
// standing one (Torino 1787, pp. 62-64). The judge offers it; the bot has to weigh it with the other legal bids and the pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { ctxOf, bidAction } from '../../bots/policy.js';
import { game, level } from './lib.mjs';

const types = (h, seat) => h.legal(seat).map((a) => a.type);
const act = (h, seat, type) => {
	assert.deepEqual(h.toAct(), [seat]);
	assert.ok(h.apply(seat, { type }).ok, type);
};

// the table of the auction test: seat 1 says «two», seat 2 «one», seat 0 passes; seat 1 may match «one»
function matchPosition(id, seats) {
	const g = game(id, seats);
	const h = newHand(g, { seed: 'a1', dealer: 0 });
	for (let guard = 0; h.s.phase !== 'bidding' && guard < 500; guard++) { const q = h.toAct()[0]; assert.ok(h.apply(q, h.legal(q)[0]).ok); }
	return { g, h };
}

test('the judge offers the equal bid to the earlier seat only', () => {
	const { h } = matchPosition('permesso_3', 3);
	act(h, 1, 'bid_two');
	act(h, 2, 'bid_one');
	act(h, 0, 'pass');
	assert.deepEqual(types(h, 1), ['bid_one', 'bid_sans_prendre', 'pass'], 'the earlier seat may match');
	act(h, 1, 'bid_one');
	assert.deepEqual(types(h, 2), ['bid_sans_prendre', 'pass'], 'the later seat may not');
});

test('the bot weighs the equal bid with the others: it is among the candidates and in the evaluation', () => {
	const { g, h } = matchPosition('permesso_3', 3);
	act(h, 1, 'bid_two');
	act(h, 2, 'bid_one');
	act(h, 0, 'pass');
	const v = h.view(1);
	assert.ok(v.legal.some((a) => a.type === 'bid_one'));
	for (const name of ['easy', 'normal']) {
		const r = chooseAction({ game: g, view: v, level: level(name), seed: 'eq' + name });
		assert.equal(r.stats.candidates, v.legal.length, `${name}: every legal bid and the pass are candidates`);
		assert.ok(r.eval.some((e) => e.action.type === 'bid_one'), `${name}: the equal bid is judged`);
		assert.ok(v.legal.some((a) => JSON.stringify(a) === JSON.stringify(r.action)));
	}
	// the later seat, who has no right to match, is never offered it and never answers it
	act(h, 1, 'bid_one');
	const late = h.view(2);
	const r = chooseAction({ game: g, view: late, level: level('normal'), seed: 'late' });
	assert.ok(!late.legal.some((a) => a.type === 'bid_one'));
	assert.notEqual(r.action.type, 'bid_one');
	assert.ok(!r.eval.some((e) => e.action.type === 'bid_one'));
});

test('the cheap policy of the rollouts takes the equal bid when the hand is strong enough for it', () => {
	const g = game('permesso_3', 3);
	const ctx = ctxOf(g);
	const strong = ['T21', 'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14', 'T13', 'T12', 'T11', 'swords:K'];
	const weak = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T1', 'swords:3', 'swords:4', 'cups:3', 'cups:4'];
	const legal = [{ type: 'bid_one' }, { type: 'pass' }];
	const standing = { best: { contract: 'one', seat: 2 } };
	assert.equal(bidAction(ctx, strong, legal, standing).type, 'bid_one');
	assert.equal(bidAction(ctx, weak, legal, standing).type, 'pass');
	// a higher bid still goes before the equal one
	assert.equal(bidAction(ctx, strong, [{ type: 'bid_one' }, { type: 'bid_sans_prendre' }, { type: 'pass' }], standing).type, 'bid_sans_prendre');
});

test('auctions of three, five and seven seats end and every answer is legal', () => {
	for (const [id, seats] of [['permesso_3', 3], ['permesso_5', 5], ['permesso_7', 7]]) {
		const g = game(id, seats);
		for (let d = 0; d < 6; d++) {
			const h = newHand(g, { seed: 'eqa' + d, dealer: d % seats });
			for (let k = 0; !h.isOver() && h.s.phase !== 'tricks'; k++) {
				assert.ok(k < 600, 'the auction ends');
				const q = h.toAct()[0];
				const v = h.view(q);
				const a = chooseAction({ game: g, view: v, level: level('easy'), seed: `${id}${d}:${k}` }).action;
				assert.ok(v.legal.some((x) => JSON.stringify(x) === JSON.stringify(a)));
				assert.ok(h.apply(q, a).ok);
			}
		}
	}
});
