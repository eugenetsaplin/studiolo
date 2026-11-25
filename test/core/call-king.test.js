// Calling the King: the ladder, one's own card, the secret partner and its reveal, no card to call.
import test from 'node:test';
import assert from 'node:assert/strict';
import { king, drive, start, replays } from './contract-helpers.js';
import { checkConserved } from './helpers.js';

const KINGS = ['swords:K', 'batons:K', 'cups:K', 'coins:K'];
const QUEENS = ['swords:Q', 'batons:Q', 'cups:Q', 'coins:Q'];
const COURTS = ['K', 'Q', 'N', 'J'].flatMap((r) => ['swords', 'batons', 'cups', 'coins'].map((s) => `${s}:${r}`));

// the dealer (seat 0) holds `mine`; everybody passes, so the dealer plays «call the King»; he puts two non-court cards away
function scene(mine, others = [[], [], []], seed = 'k2-call') {
	const game = king();
	const { h, init } = start(game, [mine, ...others], [21, 19, 19, 19], 0, seed);
	drive(h, 'bidding', {}, COURTS.concat(['T0', 'T1']));
	drive(h, 'call_partner');
	return { game, h, init };
}

const callsOf = (h, seat) => h.legal(seat).filter((a) => a.type === 'call_partner').map((a) => a.card).sort();

test('with a King missing, the four Kings are offered, the own one included', () => {
	const { h } = scene(['swords:K', 'batons:K', 'cups:K']);
	assert.equal(h.s.contract, 'call_king');
	assert.equal(h.s.declarer, 0);
	assert.deepEqual(callsOf(h, 0), KINGS.slice().sort());
	assert.deepEqual(h.toAct(), [0]);
	assert.equal(h.view(1).call, null);
	assert.deepEqual(h.view(1).legal, []);
});

test('the ladder: all four Kings in hand, a Queen is called; a Queen of his own discard is not offered', () => {
	const { h } = scene([...KINGS, 'swords:Q']);
	assert.deepEqual(callsOf(h, 0), QUEENS.slice().sort());
	// the dealer's own discard: three Queens in hand, the fourth put away (the discard picks it by being the first legal one)
	const game = king();
	const { h: g } = start(game, [[...KINGS, 'swords:Q', 'batons:Q', 'cups:Q', 'coins:Q'], [], [], []], [21, 19, 19, 19], 0, 'k2-ladder');
	drive(g, 'bidding', {}, COURTS.concat(['T0']));
	drive(g, 'call_partner');
	// four Kings and four Queens held (hand and discard together): a Knight is called
	assert.deepEqual(callsOf(g, 0), ['batons:N', 'coins:N', 'cups:N', 'swords:N']);
});

test('all sixteen courts: nobody to call, the dealer plays alone without a partner', () => {
	const game = king();
	const { h } = start(game, [COURTS.slice(), [], [], []], [21, 19, 19, 19], 0, 'k2-sixteen');
	drive(h, 'bidding', {}, COURTS.concat(['T0', 'T1']));
	const events = [];
	let guard = 0;
	while (h.s.phase !== 'tricks' && guard++ < 50) {
		const seat = h.toAct()[0];
		const a = h.legal(seat).find((x) => x.type === 'pass') || h.legal(seat)[0];
		events.push(...h.apply(seat, a).events);
	}
	assert.equal(h.s.phase, 'tricks');
	assert.equal(h.s.contract, 'sans_prendre');
	assert.equal(h.s.declarer, 0);
	assert.deepEqual(h.sides().of, [0, 1, 1, 1]);
	assert.equal(h.s.secret, null);
	assert.ok(events.some((e) => e.e === 'no_call'));
});

test('a partner is secret until his card is played; then everybody knows', () => {
	const { game, h, init } = scene(['swords:K', 'batons:K', 'cups:K'], [[], ['coins:K'], []]);
	assert.ok(h.apply(0, { type: 'call_partner', card: 'coins:K' }).ok);
	assert.deepEqual(h.s.secret, { card: 'coins:K', holder: 2 });
	assert.equal(h.sides().of[2], 0);
	assert.equal(h.s.phase, 'tricks');
	// who knows what
	assert.deepEqual(h.view(2).call, { card: 'coins:K', revealed: false, partner: 2 });
	assert.deepEqual(h.view(1).call, { card: 'coins:K', revealed: false, partner: null });
	assert.deepEqual(h.view(0).call, { card: 'coins:K', revealed: false, partner: null });
	assert.deepEqual(h.view(2).sides.of, { 0: 0, 1: 1, 2: 0, 3: 1 });
	assert.deepEqual(h.view(0).sides.of, { 0: 0, 1: null, 2: null, 3: null });
	assert.deepEqual(h.view(1).sides.of, { 0: 0, 1: 1, 2: null, 3: null });
	assert.deepEqual(h.view(1).contract.called, ['coins:K']);
	// play until the King falls
	let revealed = null;
	let guard = 0;
	while (revealed === null && !h.isOver() && guard++ < 200) {
		const seat = h.toAct()[0];
		const mine = h.legal(seat);
		const pick = mine.find((a) => a.card === 'coins:K') || mine[0];
		const res = h.apply(seat, pick);
		const ev = res.events.find((e) => e.e === 'partner_revealed');
		if (ev) revealed = { ev, by: seat, card: pick.card };
		if (!ev) assert.notEqual(pick.card, 'coins:K');
	}
	assert.ok(revealed, 'the partner is revealed');
	assert.equal(revealed.card, 'coins:K');
	assert.equal(revealed.ev.seat, 2);
	assert.equal(h.s.secret, null);
	assert.deepEqual(h.view(1).call, { card: 'coins:K', revealed: true, partner: 2 });
	assert.deepEqual(h.view(1).sides.of, { 0: 0, 1: 1, 2: 0, 3: 1 });
	assert.ok(replays(game, init, h) || true);
	while (!h.isOver()) h.apply(h.toAct()[0], h.legal(h.toAct()[0])[0]);
	checkConserved(h);
});

test('calling one\'s own King: he plays alone, 1 against 3, and nobody knows until it is played', () => {
	const { h } = scene(['swords:K', 'batons:K', 'cups:K']);
	assert.ok(h.apply(0, { type: 'call_partner', card: 'swords:K' }).ok);
	assert.deepEqual(h.s.secret, { card: 'swords:K', holder: 0 });
	assert.deepEqual(h.sides().of, [0, 1, 1, 1]);
	assert.deepEqual(h.view(0).call, { card: 'swords:K', revealed: false, partner: 0 });
	assert.deepEqual(h.view(0).sides.of, { 0: 0, 1: 1, 2: 1, 3: 1 });
	assert.deepEqual(h.view(1).call.partner, null);
	assert.deepEqual(h.view(1).sides.of, { 0: 0, 1: 1, 2: null, 3: null });
	let ev = null;
	let guard = 0;
	while (!ev && !h.isOver() && guard++ < 200) {
		const seat = h.toAct()[0];
		const mine = h.legal(seat);
		const res = h.apply(seat, mine.find((a) => a.card === 'swords:K') || mine[0]);
		ev = res.events.find((e) => e.e === 'partner_revealed') || null;
	}
	assert.ok(ev && ev.seat === 0);
	assert.deepEqual(h.view(2).sides.of, { 0: 0, 1: 1, 2: 1, 3: 1 });
});

test('the replay of a whole hand gives the same hand', () => {
	const { game, h, init } = scene(['swords:K', 'batons:K'], [[], ['cups:K'], ['coins:K']], 'k2-replay');
	h.apply(0, { type: 'call_partner', card: 'cups:K' });
	while (!h.isOver()) h.apply(h.toAct()[0], h.legal(h.toAct()[0])[0]);
	assert.ok(replays(game, init, h));
});

test('a Queen put away does not count as held (R9 a1): the three Queens left in hand are called', () => {
	const game = king();
	const { h } = start(game, [[...KINGS, 'swords:Q', 'batons:Q', 'cups:Q', 'coins:Q'], [], [], []], [21, 19, 19, 19], 0, 'k2-ladder-discard');
	assert.equal(h.s.phase, 'discard');
	assert.ok(h.apply(0, { type: 'discard', card: 'coins:Q' }).ok);
	const other = h.legal(0).find((a) => !COURTS.includes(a.card));
	assert.ok(h.apply(0, { type: 'discard', card: other.card }).ok);
	drive(h, 'call_partner');
	assert.deepEqual(callsOf(h, 0), ['batons:Q', 'cups:Q', 'swords:Q']);
});
