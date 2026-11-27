// Venticinque for two, the example of Torino 1787, p. 54 (27 against 28, the Fool's card paid): with the discard counted for the dealer
// the sides end 28 : 29.5, with the other reading (discard counts_for nobody) 28 : 28. The chosen `nobody` must beat count.dealer_forfeit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, newH } from './lib.mjs';
import { DECK } from '../../core/index.js';

const SEQ = 'C10/C9b B8/B5b C3/C5b B1/B3a T13/T18b C8/C2a D4/D3b T1/T14a T5/T17b CN/CQa D8/Fa T20/T19a BN/BJa S1/S5b S2/S4a B9/T16b DN/DJb S8/S10a T8/T15b CK/C4b T7/T4b S9/T9a T11/D6a B2/D9a D2/DKb'.split(' ');
const DISC = ['B4', 'B6', 'B10'];
const card = (s) => (s === 'F' ? 'T0' : s[0] === 'T' ? s : ({ C: 'cups', D: 'coins', S: 'swords', B: 'batons' }[s[0]] + ':' + s.slice(1)));

function play(g) {
	const hands = [[], []];
	const plays = [];
	let leader = 0;
	for (const t of SEQ) {
		const [x, y] = t.slice(0, -1).split('/').map(card);
		const winner = t.endsWith('a') ? 0 : 1;
		hands[leader].push(x);
		hands[1 - leader].push(y);
		plays.push([{ seat: leader, card: x }, { seat: 1 - leader, card: y }, winner]);
		leader = winner;
	}
	hands[1].push(...DISC.map(card));
	const rest = DECK.filter((c) => !hands[0].includes(c) && !hands[1].includes(c));
	const h = newH(g, 'v-nobody', 1, { preset: { hands: { 0: hands[0], 1: hands[1] }, rest } });
	const act = (seat, a) => assert.equal(h.apply(seat, a).ok, true, JSON.stringify([seat, a]));
	for (const c of DISC) act(1, { type: 'discard', card: card(c) });
	for (const [p, q] of plays) { act(p.seat, { type: 'play', card: p.card }); act(q.seat, { type: 'play', card: q.card }); }
	if (!h.isOver()) act(1, { type: 'fool_give', card: 'cups:10' });
	return h;
}

test('venticinque for two: the main reading counts the discard for the dealer (28 : 29.5), the other reading leaves it out (28 : 28)', () => {
	const main = play(load('venticinque', 2));
	assert.deepEqual(Object.values(main.result().sidePoints).map((x) => x / 12), [28, 29.5]);
	const other = play(load('venticinque', 2, { alts: ['hand.phases[discard].settings.counts_for'] }));
	assert.deepEqual(Object.values(other.result().sidePoints).map((x) => x / 12), [28, 28]);
	assert.equal(other.result().breakdown[1].discard, 0);
});
