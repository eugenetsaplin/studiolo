// Independent check of the contract games: pairs of states that differ only in what a seat may not know give that seat the same view;
// the journal events carry only what the table shows. Also the declarations and the two deals of Mitigati.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, makeRng, Hand } from '../../core/index.js';
import { INFO } from '../../core/cards.js';
import { kindAmount } from '../../core/modules/declarations.js';
import { load, step, act, playUntil } from './lib.mjs';

const view = (h, q) => JSON.stringify(h.view(q));
const twin = (h) => new Hand(h.game, JSON.parse(JSON.stringify(h.s)));
const swapCard = (list, a, b) => { list[list.indexOf(a)] = b; };

test('the laid cards: a seat other than the declarer sees the same view whatever was laid', () => {
	const g = load('permesso_4', 4);
	let n = 0;
	for (let i = 0; i < 60; i++) {
		const h = playUntil(newHand(g, { seed: 'sl:' + i, dealer: 0 }), (x) => x.s.phase === 'exchange' && x.s.m.exchange.stage === 'call', 'sl' + i);
		if (h.isOver()) continue;
		const d = h.s.declarer;
		for (let v = 0; v < 4; v++) {
			if (v === d) continue;
			const t = [0, 1, 2, 3].find((q) => q !== v && q !== d);
			const b = twin(h);
			const x = b.s.m.exchange.laid[0];
			const y = b.s.hands[t][0];
			b.s.m.exchange.laid[0] = y;
			swapCard(b.s.hands[t], y, x);
			assert.equal(view(b, v), view(h, v), `seat ${v} learns the laid cards`);
		}
		n++;
	}
	assert.ok(n > 10);
});

test('which laid card a holder got: another seat cannot tell', () => {
	const g = load('permesso_5', 5);
	let n = 0;
	for (let i = 0; i < 1500 && n < 15; i++) {
		const h = playUntil(newHand(g, { seed: 'sg:' + i, dealer: 0 }), (x) => x.s.phase === 'tricks', 'sg' + i);
		const m = h.s.m.exchange;
		if (h.isOver() || !m || m.stage !== 'done') continue;
		const holders = Object.keys(m.got).map(Number);
		if (holders.length < 2) continue;
		const [a, b] = holders;
		for (let v = 0; v < 5; v++) {
			if (v === a || v === b) continue;
			const w = twin(h);
			const ga = w.s.m.exchange.got[a][0];
			const gb = w.s.m.exchange.got[b][0];
			w.s.m.exchange.got[a][0] = gb;
			w.s.m.exchange.got[b][0] = ga;
			swapCard(w.s.hands[a], ga, gb);
			swapCard(w.s.hands[b], gb, ga);
			assert.equal(view(w, v), view(h, v), `seat ${v} learns the gifts`);
		}
		n++;
	}
	assert.ok(n >= 3, 'hands with two holders: ' + n);
});

test('the secret partner: nobody but the holder knows him before the called card is played', () => {
	const g = load('chiamare_il_re', 4);
	let n = 0;
	for (let i = 0; i < 300 && n < 20; i++) {
		const h = playUntil(newHand(g, { seed: 'sp:' + i, dealer: 0 }), (x) => x.s.phase === 'bidding', 'sp' + i);
		act(h, 0, 'pass');
		if (h.s.phase !== 'call_partner') continue;
		const call = h.legal(0).find((a) => !h.s.hands[0].includes(a.card));
		if (!call) continue;
		act(h, 0, 'call_partner', call.card);
		// a few cards of the play, the called card still unplayed
		const rng = makeRng('sp' + i);
		for (let k = 0; k < 6 && h.s.secret; k++) {
			const seat = h.toAct()[0];
			const legal = h.legal(seat).filter((a) => a.card !== call.card);
			if (!legal.length) break;
			h.apply(seat, legal[rng.int(legal.length)]);
		}
		if (!h.s.secret) continue;
		const holder = h.s.secret.holder;
		for (const v of [0, 1, 2, 3]) {
			if (v === holder) continue;
			const t = [1, 2, 3].find((q) => q !== v && q !== holder);
			if (t === undefined) continue;
			const w = twin(h);
			const y = w.s.hands[t].find((c) => c !== call.card);
			swapCard(w.s.hands[holder], call.card, y);
			swapCard(w.s.hands[t], y, call.card);
			w.s.secret.holder = t;
			w.s.m.call_partner.holder = t;
			w.s.sides.of[holder] = 1;
			w.s.sides.of[t] = 0;
			// the hands of holder and t may now allow other plays; only the viewer's own view is compared
			assert.equal(view(w, v), view(h, v), `seat ${v} learns the partner`);
		}
		n++;
	}
	assert.ok(n >= 5);
});

test('another seat\'s discard and the order of the stock are not seen', () => {
	const g = load('permesso_3', 3);
	const h = playUntil(newHand(g, { seed: 'sd', dealer: 0 }), (x) => x.s.phase === 'bidding', 'sd');
	for (const v of [1, 2]) {
		const t = v === 1 ? 2 : 1;
		const w = twin(h);
		const x = w.s.discard[0][0];
		const y = w.s.hands[t][0];
		w.s.discard[0][0] = y;
		swapCard(w.s.hands[t], y, x);
		assert.equal(view(w, v), view(h, v));
	}
	const s3 = load('sedici_3', 3);
	const k = playUntil(newHand(s3, { seed: 'st', dealer: 0 }), (x) => x.s.phase === 'tricks', 'st');
	const w = twin(k);
	w.s.rest.reverse();
	for (const v of [0, 1, 2]) assert.equal(view(w, v), view(k, v));
});

test('journal events of the contract games carry only public fields', () => {
	const allowed = {
		bid: ['seat', 'bid'], contract_won: ['contract', 'declarer'], all_passed: [], thrown_in: ['reason'],
		laid: ['seat', 'n', 'contract'], called: ['cards'], exchanged: ['n'], partner_called: ['card'], partner_revealed: ['seat'],
		declared: ['seat', 'kind', 'n', 'cards'],
	};
	for (const [id, n] of [['permesso_4', 4], ['chiamare_il_re', 4], ['bagattultimo', 3], ['mitigati_2', 2]]) {
		const g = load(id, n);
		for (let i = 0; i < 40; i++) {
			const h = newHand(g, { seed: `ev:${i}`, dealer: i % n });
			const rng = makeRng('ev' + i);
			while (!h.isOver()) {
				const { r } = step(h, rng);
				for (const e of r.events) {
					if (!(e.e in allowed)) continue;
					for (const k of Object.keys(e)) if (k !== 'e') assert.ok(allowed[e.e].includes(k), `${id}: event ${e.e} carries ${k}`);
					if (e.e === 'declared' && e.cards) assert.equal(g.plan.find((p) => p.module === 'declarations').set.kinds.find((x) => x.id === e.kind).show, 'expose');
				}
			}
		}
	}
});

test('the tariff of pp. 93-95: Onori 3-10, 4-15, 5-20 (+5 each beyond); trumps as many as held from ten; Mitigati 10', () => {
	const g = load('bagattultimo', 3);
	const kinds = Object.fromEntries(g.plan.find((p) => p.module === 'declarations').set.kinds.map((k) => [k.id, k]));
	assert.deepEqual([3, 4, 5, 6, 7].map((x) => kindAmount(kinds.onori, x, g.options)), [10, 15, 20, 25, 30]);
	assert.deepEqual([10, 11, 12, 15].map((x) => kindAmount(kinds.trionfi, x, g.options)), [10, 11, 12, 15]);
	assert.equal(kindAmount(kinds.mitigati, 3, g.options), 10);
	let declared = 0;
	let exposed = 0;
	for (let i = 0; i < 300; i++) {
		const h = playUntil(newHand(g, { seed: 'de:' + i, dealer: i % 3 }), (x) => x.s.phase === 'declarations', 'de' + i);
		if (h.s.phase !== 'declarations') continue;
		const spoke = new Set();
		while (h.s.phase === 'declarations') {
			const seat = h.toAct()[0];
			assert.ok(!spoke.has(seat), 'a seat that said done spoke again');
			const legal = h.legal(seat);
			const offer = h.view(seat).declarations.offer;
			assert.deepEqual(legal.filter((a) => a.type !== 'declare_done').map((a) => a.type.slice(8)), offer);
			const a = legal[0];
			const r = h.apply(seat, a);
			if (a.type === 'declare_done') { spoke.add(seat); continue; }
			const ev = r.events.find((e) => e.e === 'declared');
			declared++;
			const amount = kindAmount(kinds[ev.kind], ev.n, g.options);
			const paid = h.s.m.declarations.paid.filter((p) => p.to === seat && p.kind === ev.kind);
			assert.equal(paid.length, 2);
			assert.ok(paid.every((p) => p.amount === amount));
			if (ev.kind === 'trionfi') {
				exposed++;
				assert.equal(ev.cards.length, ev.n);
				assert.ok(ev.n >= 10 && ev.cards.every((c) => INFO[c].trump), 'ten trumps or more exposed (the Fool counts: selector trumps, finding of the report)');
				for (const q of [0, 1, 2]) assert.deepEqual(h.view(q).declarations.made.find((d) => d.kind === 'trionfi' && d.seat === seat).cards, ev.cards);
			}
			if (ev.kind === 'onori') assert.ok(!('cards' in ev), 'honours are announced by count, not shown');
		}
		while (!h.isOver()) step(h, makeRng('x'));
		const r = h.result();
		for (const p of h.s.m.declarations.paid) assert.ok(r.payments.some((x) => x.from === p.from && x.to === p.to && x.amount === p.amount && x.why === 'declaration'));
	}
	assert.ok(declared > 20 && exposed > 0, `declared ${declared}, exposed ${exposed}`);
});

test('Mitigati for two: 25 cards each when the first card is led', () => {
	const g = load('mitigati_2', 2);
	for (let i = 0; i < 100; i++) {
		const h = playUntil(newHand(g, { seed: 'mi:' + i, dealer: i % 2 }), (x) => x.s.phase === 'tricks', 'mi' + i);
		assert.deepEqual(h.s.hands.map((l) => l.length), [25, 25]);
		assert.equal(h.s.rest.length, 0);
	}
});
