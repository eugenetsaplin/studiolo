// Independent check of the core: what each seat may know. After every action of random hands of the six games, every card id in view(seat)
// must be one the seat may know: its own hand and discard, cards played in public, prize cards shown to it, and its
// partners' hands only with partners_share_hands. Then the adversarial positions one by one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DECK } from '../../core/index.js';
import { load, loadWith, phaseOf, SIX, newH, playOut, idsIn, allowedIds } from './lib.mjs';

function shownPrizes(h, seat, show) {
	const out = new Set();
	for (const d of h.snapshot().drawn) {
		if (d.seat === seat || show === 'all' || (show === 'opponents' && h.game.sides.of[d.seat] !== h.game.sides.of[seat])) out.add(d.card);
	}
	return out;
}

function checkViews(h, show = 'opponents', share = false) {
	const n = h.game.seats;
	for (let q = 0; q < n; q++) {
		const v = h.view(q);
		const ok = allowedIds(h, q);
		for (const c of shownPrizes(h, q, show)) ok.add(c);
		if (share) for (let p = 0; p < n; p++) if (p !== q && h.game.sides.of[p] === h.game.sides.of[q]) for (const c of h.s.hands[p]) ok.add(c);
		for (const c of idsIn(v)) assert.ok(ok.has(c), `seat ${q} sees ${c} (phase ${h.s.phase})`);
		assert.deepEqual(v.legal, h.legal(q));
		assert.deepEqual(v.hand, [...v.hand].sort((a, b) => DECK.indexOf(a) - DECK.indexOf(b)), 'own hand in canonical order');
		if (h.s.seed.length > 8) assert.ok(!JSON.stringify(v).includes(h.s.seed), 'the seed is in a view');
		for (const k of ['rest', 'stock']) assert.equal(typeof v[k].count, 'number');
	}
}

const pick = (hh, seat, legal, rng) => (legal[0].type === 'a_monte_propose' && rng.next() < 0.7 ? legal[1] : legal[rng.int(legal.length)]);

test('random hands of the six games: no view shows a card its seat may not know, at any moment, the end included', () => {
	for (const [id, n] of SIX) {
		const g = load(id, n);
		for (let i = 0; i < 25; i++) {
			const h = newH(g, `sc-${id}-${n}-${i}`, i % n);
			checkViews(h);
			playOut(h, { seed: `s${id}${i}`, pick, each: (hh) => checkViews(hh) });
		}
	}
});

test('venticinque: the dealer\'s discard and the 25 cards out never reach the other seat, before or after the end', () => {
	const g = load('venticinque', 2);
	const h = newH(g, 'disc', 0);
	const out = h.snapshot().rest.slice();
	playOut(h, { seed: 'disc' });
	const disc = h.snapshot().discard[0];
	assert.equal(disc.length, 3);
	const v1 = JSON.stringify(h.view(1));
	for (const c of [...disc, ...out]) assert.ok(!v1.includes(`"${c}"`), c);
	assert.deepEqual(h.view(0).discard.mine, disc);
	assert.deepEqual(h.view(1).discard.mine, []);
	assert.equal(h.view(1).discard.counts[0], 3);
	for (const c of out) assert.ok(!JSON.stringify(h.view(0)).includes(`"${c}"`));
});

test('morto: the stock is hidden before a draw; a drawn card is shown to the drawer and his opponent; show_to nobody hides it', () => {
	const g = load('morto', 2);
	const h = newH(g, 'stock', 1);
	const stock = h.snapshot().stock.slice();
	for (const q of [0, 1]) for (const c of stock) assert.ok(!JSON.stringify(h.view(q)).includes(`"${c}"`));
	// play to the end of the first trick
	while (h.s.tricks.length === 0) { const s = h.toAct()[0]; h.apply(s, h.legal(s)[0]); }
	for (const q of [0, 1]) {
		const v = h.view(q);
		assert.deepEqual(v.stock.drawn.map((d) => d.card), [stock[0]]);
		assert.equal(v.tricks[0].prize, stock[0]);
		assert.equal(v.stock.count, 24);
		for (const c of stock.slice(1)) assert.ok(!JSON.stringify(v).includes(`"${c}"`));
	}
	const g2 = loadWith('morto', 2, (f) => { phaseOf(f, 'morto').settings.show_to.value = 'nobody'; });
	const h2 = newH(g2, 'stock', 1);
	while (h2.s.tricks.length === 0) { const s = h2.toAct()[0]; h2.apply(s, h2.legal(s)[0]); }
	const drawer = h2.s.drawn[0].seat;
	assert.deepEqual(h2.view(drawer).stock.drawn.map((d) => d.card), [stock[0]]);
	assert.deepEqual(h2.view(1 - drawer).stock.drawn, []);
	assert.equal(h2.view(1 - drawer).tricks[0].prize, null);
	assert.ok(!JSON.stringify(h2.view(1 - drawer)).includes(`"${stock[0]}"`) || h2.s.hands[1 - drawer].includes(stock[0]));
});

test('partita_4: a partner\'s hand stays hidden; consiglio (partners_share_hands) shows exactly the partner\'s hand', () => {
	const h = newH(load('partita_4', 4), 'pt', 0);
	for (let q = 0; q < 4; q++) {
		const v = JSON.stringify(h.view(q));
		for (const c of h.s.hands[(q + 2) % 4]) assert.ok(!v.includes(`"${c}"`));
		assert.equal(h.view(q).partnerHands, undefined);
	}
	const c = newH(load('consiglio', 4), 'cs', 0);
	for (let q = 0; q < 4; q++) {
		const v = c.view(q);
		const partner = q ^ 1;
		assert.deepEqual(Object.keys(v.partnerHands).map(Number), [partner]);
		assert.deepEqual(v.partnerHands[partner], c.s.hands[partner]);
		for (const o of [0, 1, 2, 3].filter((x) => x !== q && x !== partner)) for (const card of c.s.hands[o]) assert.ok(!JSON.stringify(v).includes(`"${card}"`));
	}
});

test('venticinque_3 a monte: during the windows and the vote a view holds only the seat\'s own dealt cards', () => {
	const h = newH(load('venticinque_3', 3), 'am', 2);
	assert.equal(h.s.phase, 'a_monte');
	assert.ok(h.apply(0, { type: 'a_monte_propose' }).ok);
	assert.deepEqual(h.toAct().sort(), [1, 2]);
	checkViews(h);
	for (let q = 0; q < 3; q++) {
		const v = h.view(q);
		assert.equal(v.hand.length, 5);
		assert.equal(v.aMonte.stage, 'vote');
	}
	assert.ok(h.apply(1, { type: 'a_monte_agree' }).ok);
	assert.equal(h.apply(1, { type: 'a_monte_agree' }).ok, false, 'one vote per seat');
	checkViews(h);
	const before = h.snapshot().hands[0].slice();
	assert.ok(h.apply(2, { type: 'a_monte_agree' }).ok);
	assert.equal(h.snapshot().redeals, 1);
	assert.notDeepEqual(h.snapshot().hands[0], before);
	checkViews(h);
});

test('one refusal closes the a monte window and the deal goes on', () => {
	const h = newH(load('venticinque_3', 3), 'amr', 0);
	h.apply(1, { type: 'a_monte_propose' });
	h.apply(2, { type: 'a_monte_agree' });
	assert.ok(h.apply(0, { type: 'a_monte_refuse' }).ok);
	assert.equal(h.snapshot().redeals, 0);
	assert.equal(h.s.hands[0].length, 15);
	assert.equal(h.s.phase, 'a_monte');
});

test('a successful a monte redeals with the hand seed + "/a" + count', () => {
	const g = load('venticinque_3', 3);
	const h = newH(g, 'seedA', 0);
	h.apply(1, { type: 'a_monte_propose' });
	h.apply(2, { type: 'a_monte_agree' });
	h.apply(0, { type: 'a_monte_agree' });
	const fresh = newH(g, 'seedA/a1', 0);
	assert.deepEqual(h.snapshot().hands, fresh.snapshot().hands);
	assert.equal(h.snapshot().cut, fresh.snapshot().cut);
});

test('the Fool\'s give (owner_choice): only the owner gets the choice; nobody else sees the options', () => {
	// partita_3: seat 1 leads the Fool on trick 1 and keeps winning cards later
	const g = load('partita_3', 3);
	let found = 0;
	for (let i = 0; i < 60 && found < 5; i++) {
		const h = newH(g, 'fg' + i, 0);
		playOut(h, {
			seed: 'fg' + i,
			pick: (hh, seat, legal, rng) => {
				if (legal[0].type === 'fool_give') {
					found++;
					const owner = hh.s.foolGive.from;
					assert.equal(seat, owner);
					for (let q = 0; q < 3; q++) {
						assert.deepEqual(hh.view(q).legal, q === owner ? legal : []);
						assert.deepEqual(hh.view(q).toAct, [owner]);
					}
					checkViews(hh);
				}
				return legal[rng.int(legal.length)];
			},
		});
	}
	assert.ok(found > 0, 'no fool_give step was reached');
});

test('the view has the contract\'s shape (section 7) in every phase', () => {
	const KEYS = ['game', 'revision', 'seat', 'seats', 'dealer', 'phase', 'toAct', 'hand', 'handCounts', 'discard', 'rest', 'stock', 'trick', 'tricks', 'won', 'sides', 'legal', 'aMonte', 'result', 'match'];
	for (const [id, n] of [['venticinque_3', 3], ['morto', 2], ['partita_4', 4]]) {
		const h = newH(load(id, n), 'shape-' + id, 0);
		const check = (hh) => {
			for (let q = 0; q < n; q++) {
				const v = hh.view(q);
				for (const k of KEYS) assert.ok(k in v, `${id}: view lacks ${k}`);
				assert.equal(v.seat, q);
				assert.equal(v.seats, n);
				assert.ok(Array.isArray(v.discard.mine) && typeof v.discard.counts === 'object');
				assert.ok(Array.isArray(v.stock.drawn) && Array.isArray(v.trick.cards));
				assert.equal(Object.keys(v.handCounts).length, n);
				assert.equal(Object.keys(v.sides.of).length, n);
				for (const t of v.tricks) for (const k of ['leader', 'cards', 'winner', 'fool', 'prize']) assert.ok(k in t);
				assert.equal(v.result === null, !hh.isOver());
			}
		};
		check(h);
		playOut(h, { seed: 'shape', each: check });
	}
});
