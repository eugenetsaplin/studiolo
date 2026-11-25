// The called exchange of Permesso for three: laying, calling, the gifts by the seed, secrecy, laying fewer, the discard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { permesso, drive, start, replays } from './contract-helpers.js';
import { allCards, checkConserved } from './helpers.js';

const SQ = 'swords:Q';
const CQ = 'coins:Q';
const BQ = 'batons:Q';

function scene(seed = 'k2') {
	const game = permesso();
	const wants = [[BQ], ['T0', 'swords:K', 'T1'], [SQ, CQ]];
	const { h, init } = start(game, wants, [28, 25, 25], 0, seed);
	drive(h, 'bidding', {}, [BQ, SQ, CQ, 'T0']);
	drive(h, 'exchange', { 1: 'three' });
	return { game, h, init };
}

const lay = (h, cards) => { for (const card of cards) assert.ok(h.apply(1, { type: 'lay_down', card }).ok, 'lay ' + card); };
const fillers = (h, n) => h.legal(1).filter((a) => a.type === 'lay_down' && a.card !== 'T0').slice(0, n).map((a) => a.card);

test('the declarer may lay the Fool, not a King or the Bagatto', () => {
	const { h } = scene();
	assert.equal(h.s.declarer, 1);
	assert.equal(h.s.contract, 'three');
	const cards = h.legal(1).filter((a) => a.type === 'lay_down').map((a) => a.card);
	assert.ok(cards.includes('T0'));
	assert.ok(!cards.includes('swords:K'));
	assert.ok(!cards.includes('T1'));
	assert.ok(!h.legal(1).some((a) => a.type === 'lay_done'), 'nothing laid yet: no stopping');
	assert.deepEqual(h.toAct(), [1]);
	assert.deepEqual(h.legal(0), []);
});

test('lay three, call three from two holders: the gifts come by the seed, once', () => {
	const { game, h, init } = scene('k2-gifts');
	const laid = ['T0', ...fillers(h, 2)];
	lay(h, laid);
	assert.deepEqual(h.legal(1).filter((a) => a.type !== 'call'), []);
	const calls = h.legal(1).map((a) => a.card);
	for (const c of [SQ, CQ, BQ]) assert.ok(calls.includes(c));
	for (const c of [...laid, ...h.s.hands[1]]) assert.ok(!calls.includes(c), 'own and laid cards are not callable: ' + c);
	const events = [];
	for (const card of [SQ, CQ, BQ]) events.push(...h.apply(1, { type: 'call', card }).events);
	assert.deepEqual(events.map((e) => e.e).filter((e) => ['called', 'exchanged'].includes(e)), ['called', 'exchanged']);
	assert.equal(h.s.phase, 'tricks');
	checkConserved(h);
	for (const c of [SQ, CQ, BQ]) assert.ok(h.s.hands[1].includes(c));
	for (const q of [0, 1, 2]) assert.equal(h.s.hands[q].length, 25, 'hand sizes after the exchange');
	const got2 = h.s.hands[2].filter((c) => laid.includes(c));
	const got0 = h.s.hands[0].filter((c) => laid.includes(c));
	assert.equal(got2.length, 2);
	assert.equal(got0.length, 1);
	assert.deepEqual([...got2, ...got0].sort(), laid.slice().sort());
	assert.ok(replays(game, init, h));
	// the same seed gives the same gifts; other seeds give other ones
	const again = scene('k2-gifts');
	lay(again.h, laid);
	for (const card of [SQ, CQ, BQ]) again.h.apply(1, { type: 'call', card });
	assert.deepEqual(again.h.s.hands[2], h.s.hands[2]);
	const spread = new Set();
	for (let i = 0; i < 12; i++) {
		const x = scene('k2-spread-' + i);
		lay(x.h, laid);
		for (const card of [SQ, CQ, BQ]) x.h.apply(1, { type: 'call', card });
		spread.add(x.h.s.hands[0].filter((c) => laid.includes(c)).join());
	}
	assert.ok(spread.size > 1, 'the gifts depend on the seed');
});

test('view secrecy: the laid cards are the declarer\'s, a gift is its holder\'s', () => {
	const { h } = scene('k2-view');
	const laid = ['T0', ...fillers(h, 2)];
	lay(h, laid);
	const q = (c) => '"' + c + '"';
	for (const seat of [0, 2]) {
		const v = h.view(seat);
		assert.equal(v.exchange.laid, 3);
		assert.deepEqual(v.exchange.mine.laid, []);
		for (const c of laid) assert.ok(!JSON.stringify(v).includes(q(c)) || h.s.hands[seat].includes(c), 'seat ' + seat + ' must not see ' + c);
	}
	assert.deepEqual(h.view(1).exchange.mine.laid.slice().sort(), laid.slice().sort());
	for (const card of [SQ, CQ, BQ]) h.apply(1, { type: 'call', card });
	const gifts = { 0: h.s.m.exchange.got[0], 2: h.s.m.exchange.got[2] };
	assert.equal(gifts[2].length, 2);
	assert.deepEqual(h.view(2).exchange.mine.gave.slice().sort(), [SQ, CQ].sort());
	assert.deepEqual(h.view(2).exchange.mine.got.slice().sort(), gifts[2].slice().sort());
	assert.deepEqual(h.view(0).exchange.mine.gave, [BQ]);
	assert.deepEqual(h.view(0).exchange.called.slice().sort(), [SQ, CQ, BQ].sort());
	// the other defender learns nothing of the gifts of a seat: its view holds those cards only if it holds them itself
	for (const c of gifts[2]) assert.ok(!JSON.stringify(h.view(0)).includes(q(c)));
	for (const c of gifts[0]) assert.ok(!JSON.stringify(h.view(2)).includes(q(c)));
	assert.deepEqual(h.view(1).exchange.mine.got.slice().sort(), [SQ, CQ, BQ].sort());
	assert.equal(h.view(1).contract.laid, 3);
	assert.deepEqual(h.view(2).contract.called.slice().sort(), [SQ, CQ, BQ].sort());
});

test('laying fewer than bid: the contract becomes the lower one, and its Onoranza is paid', () => {
	const { game, h, init } = scene('k2-fewer');
	lay(h, fillers(h, 1));
	assert.ok(h.legal(1).some((a) => a.type === 'lay_done'));
	const r = h.apply(1, { type: 'lay_done' });
	assert.ok(r.ok);
	assert.equal(h.s.contract, 'one');
	assert.deepEqual(r.events.map((e) => [e.e, e.n]), [['laid', 1]]);
	assert.ok(!h.legal(1).some((a) => a.type === 'lay_done'));
	assert.equal(h.view(0).contract.id, 'one');
	h.apply(1, { type: 'call', card: SQ });
	assert.equal(h.s.phase, 'tricks');
	assert.equal(h.s.hands[1].length, 25);
	assert.ok(replays(game, init, h));
	// play out with the first legal action: the stake starts at the Onoranza of the contract `one`
	let guard = 0;
	while (!h.isOver() && guard++ < 400) h.apply(h.toAct()[0], h.legal(h.toAct()[0])[0]);
	assert.ok(h.isOver());
	const res = h.result();
	if (res.contract !== undefined) assert.equal(res.contract, 'one');
	if (h.game.support.runnable && h.game.plan.some((e) => e.set.amount && JSON.stringify(e.set.amount).includes('onoranza')) && res.outcome !== 'draw' && res.outcome !== 'thrown_in') {
		const amounts = res.payments.map((p) => Math.abs(p.amount));
		assert.ok(amounts.length > 0);
		assert.ok(Math.min(...amounts) >= 4, 'at least the Onoranza of the contract one: ' + JSON.stringify(res.payments));
	}
	checkConserved(h);
});

test('a called card in the dealer\'s discard comes from it, and a laid card takes its place', () => {
	const game = permesso();
	const { h } = start(game, [[], ['T0'], []], [28, 25, 25], 0, 'k2-discard');
	drive(h, 'bidding', {}, ['T0']);
	const put = h.s.discard[0].slice();
	assert.equal(put.length, 3);
	drive(h, 'exchange', { 1: 'one' });
	const card = put[0];
	const laidCard = fillers(h, 1)[0];
	assert.ok(h.apply(1, { type: 'lay_down', card: laidCard }).ok);
	assert.ok(h.legal(1).some((a) => a.type === 'call' && a.card === card), 'a card of the dealer\'s discard may be called');
	assert.ok(h.apply(1, { type: 'call', card }).ok);
	assert.ok(h.s.hands[1].includes(card));
	assert.equal(h.s.discard[0].length, 3);
	assert.ok(h.s.discard[0].includes(laidCard));
	assert.ok(!h.s.discard[0].includes(card));
	assert.deepEqual(h.view(0).exchange.mine.gave, [card]);
	assert.deepEqual(h.view(0).exchange.mine.got, [laidCard]);
	assert.deepEqual(h.view(2).exchange.mine.gave, []);
	checkConserved(h);
	assert.equal(allCards(h).length, 78);
});

test('a card of the declarer\'s own hand or discard is not callable', () => {
	const game = permesso();
	const { h } = start(game, [['T0'], [], []], [28, 25, 25], 0, 'k2-own');
	drive(h, 'bidding', {}, ['T0']);
	const own = h.s.discard[0].slice();
	drive(h, 'exchange', { 0: 'one' });
	assert.equal(h.s.declarer, 0);
	assert.ok(h.apply(0, { type: 'lay_down', card: h.legal(0).find((a) => a.type === 'lay_down').card }).ok);
	const calls = h.legal(0).filter((a) => a.type === 'call').map((a) => a.card);
	assert.ok(calls.length > 0);
	for (const c of own) assert.ok(!calls.includes(c));
	for (const c of h.s.hands[0]) assert.ok(!calls.includes(c));
});
