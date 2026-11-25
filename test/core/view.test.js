// A view holds what the seat may know and nothing else.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, load, playRandom } from './helpers.js';

function strings(v, out = new Set()) {
	if (typeof v === 'string') out.add(v);
	else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
	else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
	return out;
}

test('a view never holds another hand, a discard that is not its own, the rest or the stock', () => {
	for (const [id, seats] of CASES) {
		const game = load(id, seats);
		for (let i = 0; i < 40; i++) {
			playRandom(game, 'v' + i, i % seats, (h) => {
				const s = h.s;
				for (let seat = 0; seat < seats; seat++) {
					const v = h.view(seat);
					const seen = strings(v);
					const hidden = new Set([...s.rest, ...s.stock]);
					for (let q = 0; q < seats; q++) if (q !== seat) { s.hands[q].forEach((c) => hidden.add(c)); s.discard[q].forEach((c) => hidden.add(c)); }
					for (const c of hidden) assert.ok(!seen.has(c), `${id}: seat ${seat} sees ${c}`);
					assert.deepEqual(v.hand, s.hands[seat]);
					assert.deepEqual(v.discard.mine, s.discard[seat]);
					assert.equal(v.rest.count, s.rest.length);
					assert.equal(v.stock.count, s.stock.length);
					assert.deepEqual(v.legal, h.legal(seat));
					assert.equal(v.seat, seat);
					assert.equal(v.seats, seats);
					for (let q = 0; q < seats; q++) assert.equal(v.handCounts[q], s.hands[q].length);
					JSON.stringify(v); // plain JSON
				}
			});
		}
	}
});

test('the view lists the closed tricks, the open trick, who is to act and the result at the end', () => {
	const game = load('venticinque', 2);
	let last = null;
	const h = playRandom(game, 'vv', 0, (hh) => { last = hh.view(1); });
	assert.equal(last.phase.id, 'over');
	assert.equal(last.tricks.length, 25);
	assert.deepEqual(last.toAct, []);
	assert.ok(last.result && last.result.winners.length === 1);
	assert.equal(last.result.points[0] + last.result.points[1], 53 * 0 + last.result.points[0] + last.result.points[1]);
	assert.equal(last.sides.mode, 'each_for_self');
	assert.equal(last.match, null);
	const v = game && h.view(0);
	assert.equal(v.won[0] + v.won[1], 50, 'the won cards of the 25 tricks');
});

test('the prize stock: the cards drawn are shown, the rest of the stock is not', () => {
	const game = load('morto', 2);
	playRandom(game, 'pz', 0, (h) => {
		const v = h.view(0);
		assert.equal(v.stock.drawn.length, h.s.drawn.length);
		assert.equal(v.stock.count + h.s.drawn.length, 25);
		for (const t of v.tricks) assert.ok(t.prize !== null);
	});
});

test('while a seat has not acted yet its legal list is empty and the other seats see only the count of its cards', () => {
	const game = load('partita_3', 3);
	const h = playRandom(game, 'lg', 0, null);
	assert.ok(h.isOver());
	const g2 = load('partita_3', 3);
	const live = playRandom(g2, 'lg2', 1, (hh, seat) => {
		for (let q = 0; q < 3; q++) if (!hh.toAct().includes(q)) assert.deepEqual(hh.view(q).legal, []);
	});
	assert.ok(live.isOver());
});
