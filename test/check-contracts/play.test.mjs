// Independent check of the contract games: every new pair plays random hands to the end with the cards conserved, replays to the same
// checksum, is deterministic by its seed, uses known action types, and plays whole matches to the end.
// DEALS_PER_PAIR (default 200) sets the hands per pair; a long run uses 2000.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, replayHand, newMatch, makeRng, DECK } from '../../core/index.js';
import { allCards } from '../core/helpers.js';
import { load, NEW_PAIRS, step } from './lib.mjs';

const DEALS = Number(process.env.DEALS_PER_PAIR || 200);
const TYPE_RE = /^[a-z_]{1,24}$/;
const CARDS = new Set(DECK);

// the deck is conserved, the cards laid down in an exchange counted where they wait (s.m.<phase>.laid, stage not done):
// the CORE_API invariant names only hands, discard, rest, stock, won and the trick (finding 1 of the report)
function conserved(h) {
	const cards = allCards(h);
	for (const m of Object.values(h.s.m)) if (m && Array.isArray(m.laid) && m.stage && m.stage !== 'done') cards.push(...m.laid);
	assert.equal(cards.length, DECK.length, 'cards conserved');
	assert.equal(new Set(cards).size, DECK.length, 'each card once');
}

for (const [id, n] of NEW_PAIRS) {
	test(`${id}:${n} is runnable and ${DEALS} random hands replay to the same checksum`, () => {
		const g = load(id, n);
		assert.equal(g.support.runnable, true, JSON.stringify(g.support.missing));
		for (let i = 0; i < DEALS; i++) {
			const seed = `v:${id}:${i}`;
			const dealer = i % n;
			const h = newHand(g, { seed, dealer });
			const rng = makeRng('r:' + seed);
			let guard = 0;
			while (!h.isOver()) {
				if (guard++ > 20000) throw new Error('hand does not end ' + seed);
				const { a } = step(h, rng);
				assert.match(a.type, TYPE_RE, 'action type the journal keeps');
				if (a.card !== undefined) assert.ok(CARDS.has(a.card), 'a card id');
				assert.deepEqual(Object.keys(a).filter((k) => k !== 'type' && k !== 'card'), [], 'actions are only {type, card?}');
				conserved(h);
			}
			const again = replayHand(g, { seed, dealer }, h.log.map((x) => x.action ? { seat: x.seat, action: x.action } : x));
			assert.equal(again.checksum(), h.checksum(), 'replay ' + seed);
			const r = h.result();
			assert.ok(r && Array.isArray(r.payments), 'a result with payments');
			for (const p of r.payments) assert.ok(Number.isFinite(p.amount) && p.amount > 0 && p.from !== p.to, 'payment ' + JSON.stringify(p));
		}
	});

	test(`${id}:${n} the same seed gives the same deal and hand`, () => {
		const g = load(id, n);
		const a = newHand(g, { seed: 'same', dealer: 0 });
		const b = newHand(g, { seed: 'same', dealer: 0 });
		assert.equal(a.checksum(), b.checksum());
	});

	test(`${id}:${n} whole matches end (random play)`, () => {
		const g = load(id, n);
		for (let k = 0; k < 3; k++) {
			const m = newMatch(g, { seed: `vm:${id}:${k}`, firstDealer: 0 });
			const rng = makeRng(`vm:${id}:${k}`);
			let hands = 0;
			for (;;) {
				while (!m.hand.isOver()) step(m.hand, rng);
				hands++;
				if (m.isOver()) break;
				assert.ok(hands < 400, 'match does not end');
				m.next();
			}
			const st = m.standing();
			const sum = Object.values(st.ledger).reduce((x, y) => x + y, 0);
			assert.equal(sum, 0, 'the ledger balances');
		}
	});
}
