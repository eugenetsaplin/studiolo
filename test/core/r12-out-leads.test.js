// Revision 12: in the last hand of a three-person running-total match a player who is out (his total of the earlier
// hands is above the line) cannot lose the match and must lead a trump, else a king (tricks.out_leads).
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, newMatch, replayHand, makeRng, DECK } from '../../core/index.js';
import { INFO } from '../../core/cards.js';
import { chooseAction } from '../../bots/random.js';
import { load, loadPatched } from './helpers.js';

const LINE = 26 * 12; // the line of the match in twelfths
const game = load('venticinque_3', 3);
const gameFree = loadPatched('venticinque_3', 3, (f) => {
	const ph = f.hand.phases.find((p) => p.id === 'tricks');
	ph.settings.out_leads.value = 'free';
}, {});

const isTrump = (c) => INFO[c].trump;
const isKing = (c) => !INFO[c].trump && INFO[c].rank === 'K';
const KINGS = DECK.filter(isKing);
const TRUMPS = DECK.filter((c) => isTrump(c) && c !== 'T0');
const PLAIN = DECK.filter((c) => !isTrump(c) && !isKing(c)); // 52 cards

// the carry of the third hand of a match: totals before it and the mark of the last hand
const carryOf = (totals, over = {}) => ({ match: { kind: 'running_total', handIndex: 2, last: true, totals, ...over } });

// A hand dealt from a preset: `lead` is the hand of the seat that leads (25 cards), the rest goes to the other two seats.
// Plays the deal to the first trick card. Returns {h, leader}.
function toTricks(g, lead, carry, dealer = 1) {
	const leader = (dealer + 1) % 3; // the seat on the dealer's right (play passes to the right: seat + 1)
	const left = DECK.filter((c) => !lead.includes(c));
	const hands = {};
	hands[leader] = lead.slice();
	const others = [0, 1, 2].filter((q) => q !== leader);
	const dealerHand = others.find((q) => q === dealer);
	const other = others.find((q) => q !== dealer);
	hands[other] = left.slice(0, 25);
	hands[dealerHand] = left.slice(25);
	const h = newHand(g, { seed: 'r12', dealer, preset: { hands, rest: [] }, carry });
	let guard = 0;
	while (h.cur.module !== 'tricks' && guard++ < 200) {
		const q = h.toAct()[0];
		const legal = h.legal(q);
		const pass = legal.find((a) => a.type === 'a_monte_pass') || legal.find((a) => a.type === 'a_monte_refuse');
		h.apply(q, pass || legal[0]);
	}
	return { h, leader: h.s.m.tricks.leader };
}

const plays = (h, seat) => h.legal(seat).filter((a) => a.type === 'play').map((a) => a.card).sort();
const sorted = (x) => x.slice().sort();

test('out_leads is a setting of the tricks phase; the other games leave it free', () => {
	const setOf = (g) => g.plan.find((e) => e.module === 'tricks').set;
	assert.equal(setOf(game).out_leads, 'trumps_then_kings');
	assert.equal(setOf(gameFree).out_leads, 'free');
	assert.equal(setOf(load('venticinque', 2)).out_leads, undefined);
});

test('the seat that is out and holds trumps may lead only a trump (the Fool is not one)', () => {
	const lead = [...TRUMPS.slice(0, 5), 'T0', ...KINGS.slice(0, 2), ...PLAIN.slice(0, 17)];
	assert.equal(lead.length, 25);
	// find the leader first: it is the seat to lead whatever the carry says
	const probe = toTricks(game, lead, null);
	const totals = [0, 0, 0];
	totals[probe.leader] = LINE + 1;
	const { h, leader } = toTricks(game, lead, carryOf(totals));
	assert.equal(leader, probe.leader);
	assert.deepEqual(plays(h, leader), sorted(TRUMPS.slice(0, 5)));
	const v = h.view(leader);
	assert.deepEqual(v.outLead, { seats: [leader], duty: 'trumps' });
	// the others see who is out, but no duty
	const o = (leader + 1) % 3;
	assert.deepEqual(h.view(o).outLead, { seats: [leader], duty: null });
	// the engine refuses a card of the hand that is not allowed
	const bad = h.apply(leader, { type: 'play', card: KINGS[0] });
	assert.equal(bad.ok, false);
	assert.equal(h.apply(leader, { type: 'play', card: TRUMPS[0] }).ok, true);
});

test('without trumps (the Fool alone is not one) the seat that is out leads a king', () => {
	const lead = ['T0', ...KINGS.slice(0, 2), ...PLAIN.slice(0, 22)];
	assert.equal(lead.length, 25);
	const probe = toTricks(game, lead, null);
	const totals = [0, 0, 0];
	totals[probe.leader] = LINE + 12;
	const { h, leader } = toTricks(game, lead, carryOf(totals));
	assert.deepEqual(plays(h, leader), sorted(KINGS.slice(0, 2)));
	assert.equal(h.view(leader).outLead.duty, 'kings');
});

test('with neither trumps nor kings the seat that is out leads any card, the Fool included', () => {
	const lead = ['T0', ...PLAIN.slice(0, 24)];
	const probe = toTricks(game, lead, null);
	const totals = [0, 0, 0];
	totals[probe.leader] = LINE + 1;
	const { h, leader } = toTricks(game, lead, carryOf(totals));
	assert.deepEqual(plays(h, leader), sorted(lead));
	assert.equal(h.view(leader).outLead.duty, null);
	assert.deepEqual(h.view(leader).outLead.seats, [leader]);
});

test('a total on the line is not out; the first two hands and an old carry bind nobody', () => {
	const lead = [...TRUMPS.slice(0, 5), ...KINGS.slice(0, 2), ...PLAIN.slice(0, 18)];
	const probe = toTricks(game, lead, null);
	const free = sorted(lead);
	const t = [0, 0, 0];
	t[probe.leader] = LINE; // on the line: not above it
	assert.deepEqual(plays(toTricks(game, lead, carryOf(t)).h, probe.leader), free);
	t[probe.leader] = LINE + 1;
	assert.deepEqual(plays(toTricks(game, lead, carryOf(t, { last: false, handIndex: 1 })).h, probe.leader), free);
	assert.deepEqual(plays(toTricks(game, lead, carryOf(t, { handIndex: 0, last: false })).h, probe.leader), free);
	// a journal of an older version: the carry has no totals and no mark; no carry at all
	assert.deepEqual(plays(toTricks(game, lead, { match: { kind: 'running_total', handIndex: 2 } }).h, probe.leader), free);
	assert.deepEqual(plays(toTricks(game, lead, null).h, probe.leader), free);
	assert.equal(toTricks(game, lead, null).h.view(probe.leader).outLead.duty, null);
	assert.deepEqual(toTricks(game, lead, null).h.view(probe.leader).outLead.seats, []);
});

test('the other reading (alt free) and the other games play as before; they have no outLead in the view', () => {
	const lead = [...TRUMPS.slice(0, 5), ...KINGS.slice(0, 2), ...PLAIN.slice(0, 18)];
	const probe = toTricks(game, lead, null);
	const t = [0, 0, 0];
	t[probe.leader] = LINE + 1;
	const { h } = toTricks(gameFree, lead, carryOf(t));
	assert.deepEqual(plays(h, probe.leader), sorted(lead));
	assert.equal('outLead' in h.view(probe.leader), false);
	const two = load('venticinque', 2);
	assert.equal('outLead' in newHand(two, { seed: 'x', dealer: 0 }).view(0), false);
});

test('a seat that is out and answers a lead plays by the usual rules', () => {
	// the seat that is out is the one that answers: the leader (free) leads a plain card; the answerer holds its suit
	const dealer = 1;
	const leader = 2;
	const out = 0; // play passes to the right: 2, then 0
	const suitOf = (c) => INFO[c].suit;
	const ledCard = PLAIN[0];
	const suit = suitOf(ledCard);
	const mate = PLAIN.filter((c) => suitOf(c) === suit && c !== ledCard).slice(0, 3);
	const outHand = [...mate, ...TRUMPS.slice(0, 6), ...KINGS.slice(0, 2), ...PLAIN.filter((c) => suitOf(c) !== suit).slice(0, 14)];
	assert.equal(outHand.length, 25);
	const rest = DECK.filter((c) => !outHand.includes(c) && c !== ledCard);
	const hands = { [out]: outHand, [leader]: [ledCard, ...rest.slice(0, 24)], [dealer]: rest.slice(24) };
	const totals = [0, 0, 0];
	totals[out] = LINE + 5;
	const h = newHand(game, { seed: 'r12b', dealer, preset: { hands, rest: [] }, carry: carryOf(totals) });
	while (h.cur.module !== 'tricks') {
		const q = h.toAct()[0];
		const legal = h.legal(q);
		h.apply(q, legal.find((a) => a.type === 'a_monte_pass' || a.type === 'a_monte_refuse') || legal[0]);
	}
	assert.equal(h.s.m.tricks.leader, leader);
	assert.equal(h.apply(leader, { type: 'play', card: ledCard }).ok, true);
	assert.ok(mate.length === 3);
	assert.deepEqual(plays(h, out), sorted(outHand.filter((c) => !isTrump(c) && suitOf(c) === suit)), 'the seat that is out follows the suit');
	assert.equal(h.view(out).outLead.duty, null);
});

test('the match puts the totals and the mark of the last hand into the hand', () => {
	const m = newMatch(game, { seed: 'carry', firstDealer: 0 });
	const rng = makeRng('carry');
	const seen = [];
	for (let i = 0; i < 3; i++) {
		seen.push(JSON.parse(JSON.stringify(m.hand.s.carry.match)));
		while (!m.hand.isOver()) {
			const q = m.hand.toAct()[0];
			assert.ok(m.hand.apply(q, chooseAction(m.hand.legal(q), rng)).ok);
		}
		if (m.isOver()) break;
		m.next();
	}
	assert.deepEqual(seen.map((x) => x.last), [false, false, true]);
	assert.deepEqual(seen[0].totals, [0, 0, 0]);
	assert.deepEqual(seen[1].totals.map(String), [0, 1, 2].map((q) => String(m.standing().hands[0].points[q] - LINE)));
	// the totals before the last hand are the standing after two hands
	const two = seen[2].totals;
	const st = m.standing();
	for (let q = 0; q < 3; q++) assert.equal(two[q], st.hands[0].points[q] + st.hands[1].points[q] - 2 * LINE);
});

// plays whole matches of random legal moves; checks every lead of the last hand against an independent rule
test('matches played at random: the last hand obeys the duty, the journal replays, the view agrees', () => {
	let leadsChecked = 0;
	let outMatches = 0;
	for (let k = 0; k < 120; k++) {
		const seed = 'rm' + k;
		const m = newMatch(game, { seed, firstDealer: k % 3 });
		const rng = makeRng(seed);
		for (let i = 0; i < 3; i++) {
			const h = m.hand;
			const before = m.standing().totals;
			const out = i === 2 ? [0, 1, 2].filter((q) => before[q] > LINE) : [];
			if (out.length) outMatches++;
			assert.deepEqual(h.view(0).outLead.seats, out);
			while (!h.isOver()) {
				const q = h.toAct()[0];
				const legal = h.legal(q);
				const plays = legal.filter((a) => a.type === 'play');
				if (out.includes(q) && h.cur.module === 'tricks' && h.s.trick.length === 0 && plays.length) {
					const hand = h.s.hands[q];
					const tr = hand.filter((c) => isTrump(c) && c !== 'T0');
					const kg = hand.filter(isKing);
					const want = tr.length ? tr : kg.length ? kg : hand;
					assert.deepEqual(sorted(plays.map((a) => a.card)), sorted(want));
					leadsChecked++;
				}
				assert.ok(h.apply(q, chooseAction(legal, rng)).ok);
			}
			const rep = replayHand(game, { seed: h.s.seed, dealer: h.s.dealer, carry: h.s.carry }, h.log);
			assert.equal(rep.checksum(), h.checksum());
			if (m.isOver()) break;
			m.next();
		}
	}
	assert.ok(outMatches >= 3, 'matches with a seat that is out: ' + outMatches);
	assert.ok(leadsChecked >= 10, 'leads checked: ' + leadsChecked);
});
