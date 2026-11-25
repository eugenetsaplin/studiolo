// Independent check of the core: the play. Every legal list and every trick winner of random hands of the six games is checked against an
// independent reading of the files (follow suit, must trump, no duty to overtrump, the Fool as excuse, torino_1787,
// italian suits); then prepared positions for the leaders and the Fool.
import test from 'node:test';
import assert from 'node:assert/strict';
import { load, SIX, newH, deal, playOut, isTrump, suitOf } from './lib.mjs';

// torino_1787: T20 above T21, then 19 down to 1
const trumpRank = (c) => (c === 'T20' ? 22 : c === 'T21' ? 21 : Number(c.slice(1)));
const RN = { J: 11, N: 12, Q: 13, K: 14 };
// italian: cups and coins 1 high .. 10 low under the courts; swords and batons 10 high .. 1 low
function suitRank(c) {
	const [s, r] = c.split(':');
	const num = RN[r] || Number(r);
	if (num > 10) return num;
	return s === 'cups' || s === 'coins' ? 11 - num : num;
}

function refLegal(hand, trick) {
	if (!trick.length) return hand.slice();
	const lead = trick.find((t) => t.card !== 'T0');
	if (!lead) return hand.slice(); // only the Fool on the table: free
	const led = suitOf(lead.card);
	const fool = hand.includes('T0') ? ['T0'] : [];
	const same = hand.filter((c) => c !== 'T0' && suitOf(c) === led);
	if (same.length) return [...same, ...fool];
	const trumps = hand.filter((c) => c !== 'T0' && isTrump(c));
	if (trumps.length) return [...trumps, ...fool];
	return hand.slice();
}

function refWinner(cards) {
	const real = cards.filter((t) => t.card !== 'T0');
	const led = suitOf(real[0].card);
	let best = null;
	for (const t of real) {
		const k = isTrump(t.card) ? 100 + trumpRank(t.card) : suitOf(t.card) === led ? suitRank(t.card) : -1;
		if (best === null || k > best.k) best = { k, seat: t.seat };
	}
	return best.seat;
}

test('random hands of the six games: legal plays and trick winners agree with the reference', () => {
	for (const [id, n] of SIX) {
		const g = load(id, n);
		for (let i = 0; i < 80; i++) {
			const dealer = i % n;
			const h = newH(g, `tr-${id}-${n}-${i}`, dealer);
			let firstTrick = true;
			let expectLeader = null;
			playOut(h, {
				seed: `${id}${n}${i}`,
				pick: (hh, seat, legal, rng) => {
					if (hh.s.phase === 'tricks') {
						const trick = hh.s.trick;
						if (!trick.length) {
							if (firstTrick) assert.equal(seat, (dealer + 1) % n, `${id}: the first leader is the dealer's right`);
							else assert.equal(seat, expectLeader, `${id}: the trick winner leads`);
							firstTrick = false;
						} else assert.equal(seat, (trick[trick.length - 1].seat + 1) % n, 'play passes to the right (+1)');
						const got = legal.map((a) => a.card).sort();
						const want = refLegal(hh.s.hands[seat], trick).sort();
						assert.deepEqual(got, want, `${id}/${n} hand ${i}: legal plays`);
					}
					return legal[0].type === 'a_monte_propose' ? legal[1] : legal[rng.int(legal.length)];
				},
				each: (hh, seat, a, r) => {
					const won = r.events.find((e) => e.e === 'trick_won');
					if (!won) return;
					const rec = hh.s.tricks[hh.s.tricks.length - 1];
					assert.equal(rec.winner, refWinner(rec.cards), `${id}: the winner of ${JSON.stringify(rec.cards)}`);
					assert.notEqual(rec.winner, rec.fool, 'the Fool\'s owner never wins by the Fool');
					expectLeader = rec.winner;
				},
			});
		}
	}
});

test('no duty to overtrump: a lower trump may answer a trump', () => {
	// non-dealer (seat 1) leads T21; the dealer holds T2 and T20 and may play either
	const p = deal([28, 25], [['T2', 'T20', 'cups:2', 'cups:3', 'cups:4'], ['T21']]);
	const g = load('venticinque', 2);
	const h = newH(g, 'ot', 0, { preset: p });
	for (const c of ['cups:2', 'cups:3', 'cups:4']) h.apply(0, { type: 'discard', card: c });
	assert.deepEqual(h.toAct(), [1]);
	assert.ok(h.apply(1, { type: 'play', card: 'T21' }).ok);
	const ok = h.legal(0).map((a) => a.card);
	assert.ok(ok.includes('T2') && ok.includes('T20'));
	assert.ok(h.apply(0, { type: 'play', card: 'T2' }).ok);
	assert.equal(h.s.tricks[0].winner, 1);
});

test('the Angel takes the World; in cups the ace takes the ten and the jack takes the ace', () => {
	assert.equal(refWinner([{ seat: 0, card: 'T21' }, { seat: 1, card: 'T20' }]), 1);
	const g = load('venticinque', 2);
	// the same through the engine
	const p = deal([28, 25], [['T20', 'cups:1', 'cups:J', 'swords:2', 'swords:3', 'swords:4'], ['T21', 'cups:10', 'cups:2']]);
	const h = newH(g, 'ord', 0, { preset: p });
	for (const c of ['swords:2', 'swords:3', 'swords:4']) h.apply(0, { type: 'discard', card: c });
	h.apply(1, { type: 'play', card: 'T21' }); h.apply(0, { type: 'play', card: 'T20' });
	assert.equal(h.s.tricks[0].winner, 0);
	h.apply(0, { type: 'play', card: 'cups:1' }); h.apply(1, { type: 'play', card: 'cups:10' });
	assert.equal(h.s.tricks[1].winner, 0);
	h.apply(0, { type: 'play', card: 'cups:J' });
	assert.ok(h.legal(1).every((a) => suitOf(a.card) === 'cups'));
	h.apply(1, { type: 'play', card: 'cups:2' });
	assert.equal(h.s.tricks[2].winner, 0);
});

test('the Fool led: the next card sets the suit, the Fool\'s owner does not win, he keeps the Fool', () => {
	// three seats: seat 1 (dealer's right) leads the Fool; seat 2 plays a cup; seat 0 must follow cups
	const g = load('partita_3', 3);
	const p = deal([28, 25, 25], [['cups:3', 'cups:4', 'swords:5', 'swords:6', 'swords:7', 'T5'], ['T0', 'T21'], ['cups:K']]);
	const h = newH(g, 'fl', 0, { preset: p });
	for (const c of ['swords:5', 'swords:6', 'swords:7']) assert.ok(h.apply(0, { type: 'discard', card: c }).ok);
	assert.deepEqual(h.toAct(), [1]);
	assert.ok(h.apply(1, { type: 'play', card: 'T0' }).ok);
	// after the Fool the next player is free
	assert.equal(h.legal(2).length, h.s.hands[2].length);
	assert.ok(h.apply(2, { type: 'play', card: 'cups:K' }).ok);
	const ok0 = h.legal(0).map((a) => a.card);
	assert.ok(ok0.every((c) => suitOf(c) === 'cups'), 'the cup led after the Fool binds: ' + ok0);
	assert.ok(h.apply(0, { type: 'play', card: 'cups:3' }).ok);
	const t = h.s.tricks[0];
	assert.equal(t.winner, 2);
	assert.equal(t.fool, 1);
	assert.ok(h.s.won[1].includes('T0'));
	assert.ok(!h.s.won[2].includes('T0'));
	assert.deepEqual(h.toAct(), [2]);
});

test('the Fool may be played on any trick, even holding the led suit, and is kept in the last trick', () => {
	const g = load('venticinque', 2);
	const p = deal([28, 25], [['T0', 'cups:5', 'swords:2', 'swords:3', 'swords:4'], ['cups:K']]);
	const h = newH(g, 'fl2', 0, { preset: p });
	for (const c of ['swords:2', 'swords:3', 'swords:4']) h.apply(0, { type: 'discard', card: c });
	h.apply(1, { type: 'play', card: 'cups:K' });
	const ok = h.legal(0).map((a) => a.card);
	assert.ok(ok.includes('T0') && ok.includes('cups:5'));
	// keep the Fool for the last trick: play everything else first
	playOut(h, { pick: (hh, seat, legal) => (seat === 0 && legal.length > 1 ? legal.find((a) => a.card !== 'T0') : legal[0]) });
	const last = h.s.tricks[h.s.tricks.length - 1];
	assert.equal(last.fool, 0);
	assert.ok(last.cards.some((c) => c.card === 'T0'));
	assert.notEqual(last.winner, 0);
	// the Fool came back to its owner and was not given away
	const sn = h.snapshot();
	assert.ok(sn.won[0].includes('T0'));
	assert.notEqual(sn.foolGive && sn.foolGive.card, 'T0');
});

test('first leader: venticinque the non-dealer; meno at 7 seats the dealer\'s right', () => {
	for (let d = 0; d < 2; d++) {
		const h = newH(load('venticinque', 2), 'fl' + d, d);
		while (h.s.phase === 'discard') h.apply(d, h.legal(d)[0]);
		assert.deepEqual(h.toAct(), [1 - d]);
	}
	for (let d = 0; d < 7; d++) {
		const h = newH(load('meno', 7), 'm7' + d, d);
		assert.deepEqual(h.toAct(), [(d + 1) % 7]);
	}
});
