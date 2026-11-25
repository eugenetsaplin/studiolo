// The Fool in all its settings of the six files, and the discard that counts for the dealer or not.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, valueTable, makeRng } from '../../core/index.js';
import { CARD_INDEX } from '../../core/index.js';
import { load, loadPatched, playRandom, build, discardNow } from './helpers.js';

const V = valueTable('honours_4_angel').v;

// what the owner of the Fool had won before the exchange, from the closed tricks
function wonBefore(h, seat) {
	const out = [];
	for (const t of h.s.tricks) {
		for (const c of t.cards) {
			if (c.card === 'T0') { if (c.seat === seat) out.push('T0'); } else if (t.winner === seat) out.push(c.card);
		}
		if (t.prize && t.winner === seat) out.push(t.prize);
	}
	return out;
}

function foolOwner(h) {
	const t = h.s.tricks.find((x) => x.fool !== null);
	return t ? { owner: t.fool, rec: t } : null;
}

test('cheapest: the won card with the fewest points, then the earliest in the canonical order; to the opponent', () => {
	const game = load('venticinque', 2);
	let given = 0;
	let none = 0;
	for (let i = 0; i < 300; i++) {
		const h = playRandom(game, 'c' + i, i % 2, null);
		const f = foolOwner(h);
		if (!f) continue; // the Fool lay among the cards out of play
		const won = wonBefore(h, f.owner).filter((c) => c !== 'T0');
		if (!won.length) { assert.equal(h.s.foolGive, null); none++; continue; }
		const best = won.slice().sort((a, b) => V[a] - V[b] || CARD_INDEX[a] - CARD_INDEX[b])[0];
		assert.equal(h.s.foolGive.card, best);
		assert.equal(h.s.foolGive.from, f.owner);
		assert.equal(h.s.foolGive.to, 1 - f.owner);
		assert.ok(h.s.won[1 - f.owner].includes(best) && !h.s.won[f.owner].includes(best));
		assert.ok(h.s.won[f.owner].includes('T0'), 'the Fool stays with its owner');
		given++;
	}
	assert.ok(given > 100);
	void none;
});

test('owner_choice: the owner picks a plain card with fool_give, to the taker of the trick (trick_winner, revision 9)', () => {
	const game = load('partita_3', 3);
	let asked = 0;
	for (let i = 0; i < 200; i++) {
		const h = playRandom(game, 'oc' + i, i % 3, (hh, seat, action) => {
			if (action.type === 'fool_give') asked++;
		});
		const f = foolOwner(h);
		const g = h.s.foolGive;
		const won = wonBefore(h, f.owner).filter((c) => c !== 'T0');
		if (!won.length || f.rec.winner === f.owner) { if (!won.length) assert.equal(g, null); continue; }
		assert.ok(won.includes(g.card));
		assert.ok(V[g.card] <= 1 || won.every((c) => V[c] > 1), 'a plain card, if the owner has one');
		assert.equal(g.from, f.owner);
		assert.equal(g.to, f.rec.winner);
		assert.ok(h.log.some((e) => e.action.type === 'fool_give' && e.seat === f.owner));
	}
	assert.ok(asked > 150);
});

test('owner_choice offers plain cards only while the owner holds one', () => {
	const game = load('partita_3', 3);
	for (let i = 0; i < 60; i++) {
		playRandom(game, 'op' + i, 0, (h, seat) => {
			const fg = h.s.foolGive;
			if (fg && fg.card === null) {
				assert.deepEqual(h.toAct(), [fg.from]);
				const acts = h.legal(fg.from);
				assert.ok(acts.length > 0 && acts.every((a) => a.type === 'fool_give'));
				assert.ok(acts.every((a) => V[a.card] <= 1));
			}
		});
	}
});

test('trick_winner: the Fool is paid to the winner of the trick it was shown in', () => {
	const game = load('venticinque_3', 3);
	for (let i = 0; i < 200; i++) {
		const h = playRandom(game, 'tw' + i, i % 3, null);
		const f = foolOwner(h);
		const g = h.s.foolGive;
		if (!g) continue;
		assert.equal(g.to, f.rec.winner);
		assert.notEqual(g.to, f.owner);
	}
});

// the dealer wins no trick: the other seat holds every trump and the four kings and leads trumps first
function dealerLoses(game) {
	const trumps = Array.from({ length: 21 }, (_, i) => 'T' + (i + 1));
	const kings = ['swords:K', 'batons:K', 'cups:K', 'coins:K'];
	const isTrump = (c) => /^T\d+$/.test(c);
	const p = build([28, 25], [['T0'], [...trumps, ...kings]], [(c) => c.endsWith(':K') || isTrump(c), null]);
	const h = newHand(game, { seed: 'dl', dealer: 0, preset: p });
	while (h.s.phase === 'discard') { const a = h.legal(0).find((x) => x.card !== 'T0'); h.apply(0, a); }
	while (!h.isOver()) {
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const pick = seat === 1 ? legal[legal.length - 1] : legal[0];
		const r = h.apply(seat, pick);
		assert.ok(r.ok, JSON.stringify(r));
	}
	return h;
}

test('fool_no_tricks: give_none gives nothing, give_fool gives the Fool itself', () => {
	const a = dealerLoses(load('venticinque', 2));
	assert.ok(a.s.tricks.every((t) => t.winner === 1));
	assert.equal(foolOwner(a).owner, 0);
	assert.equal(a.s.foolGive, null);
	assert.ok(a.s.won[0].includes('T0'));
	const game = loadPatched('venticinque', 2, (f) => { f.cards.fool_no_tricks = { value: 'give_fool', source: '[S] test' }; });
	const b = dealerLoses(game);
	assert.deepEqual({ ...b.s.foolGive }, { from: 0, to: 1, options: [], card: 'T0' });
	assert.ok(b.s.won[1].includes('T0') && !b.s.won[0].includes('T0'));
});

test('dealer_forfeit: false the discard is the dealer\'s, true a dealer without a trick gives it to the last winner', () => {
	const no = dealerLoses(load('venticinque', 2));
	const yes = dealerLoses(loadPatched('venticinque', 2, (f) => { f.hand.phases.find((p) => p.id === 'count').settings.dealer_forfeit.value = true; }));
	const d = no.result().breakdown[0].discard;
	assert.ok(d > 0);
	assert.equal(no.result().breakdown[1].discard, 0);
	assert.equal(yes.result().breakdown[0].discard, 0);
	assert.equal(yes.result().breakdown[1].discard, d);
	assert.equal(yes.result().points[1], no.result().points[1] + d);
	assert.equal(yes.result().points[0], no.result().points[0] - d);
	// a dealer who won a trick keeps it even with dealer_forfeit true
	const game = loadPatched('venticinque', 2, (f) => { f.hand.phases.find((p) => p.id === 'count').settings.dealer_forfeit.value = true; });
	let kept = 0;
	for (let i = 0; i < 50; i++) {
		const h = playRandom(game, 'df' + i, 0, null);
		if (h.s.tricks.some((t) => t.winner === 0)) { assert.ok(h.result().breakdown[0].discard > 0); kept++; }
	}
	assert.ok(kept > 40);
});

test('the Fool is never taken, in the last trick too: its owner has it among his won cards', () => {
	for (const [id, seats] of [['venticinque', 2], ['morto', 2], ['partita_3', 3], ['partita_4', 4], ['meno', 5]]) {
		const game = load(id, seats);
		for (let i = 0; i < 100; i++) {
			const h = playRandom(game, 'nt' + i, i % seats, null);
			const f = foolOwner(h);
			if (f) {
				const holder = h.s.won.findIndex((w) => w.includes('T0'));
				assert.equal(holder, f.owner);
				assert.notEqual(f.rec.winner, f.owner);
			}
		}
	}
});

test('a Fool drawn from the prize stock is counted like any card, nothing is given for it', () => {
	const game = load('morto', 2);
	const p = build([28, 25], [['swords:5'], ['swords:9']], [], ['T0']);
	const h = newHand(game, { seed: 'x', dealer: 0, preset: p });
	assert.equal(h.s.stock[0], 'T0');
	discardNow(h, ['swords:5']);
	h.apply(1, { type: 'play', card: 'swords:9' });
	h.apply(0, { type: 'play', card: 'swords:5' });
	assert.equal(h.s.tricks[0].prize, 'T0');
	assert.equal(h.s.tricks[0].fool, null);
	assert.ok(h.s.won[1].includes('T0'));
	const rng = makeRng('rest');
	while (!h.isOver()) { const seat = h.toAct()[0]; const acts = h.legal(seat); h.apply(seat, acts[rng.int(acts.length)]); }
	assert.equal(h.s.foolGive, null);
	const r = h.result();
	assert.equal(r.points[0] + r.points[1], 1092);
});
