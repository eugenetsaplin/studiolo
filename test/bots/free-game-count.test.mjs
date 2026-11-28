// Revision 11: the free game (no auction) of the six and seven seat games has a count phase of its own, by one, two or
// three cards as agreed. The score lines the table shows and the points the bot counts follow the contract played,
// not the first count phase of the file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, newHand } from '../../core/index.js';
import { countEntry } from '../../core/score.js';
import { ctxOf, pointsOfCards, ownPoints } from '../../bots/policy.js';
import { countTwelfths } from '../../core/points.js';
import { getFile } from './lib.mjs';

const free = (id, seats, group) => loadGame(id, getFile, { seats, variant: 'sciolto_chosen', options: { group } });

function playOut(g, seed, dealer) {
	const h = newHand(g, { seed, dealer });
	for (let guard = 0; !h.isOver() && guard < 1500; guard++) {
		const seat = h.toAct()[0];
		assert.ok(h.apply(seat, h.legal(seat)[0]).ok);
	}
	assert.ok(h.isOver());
	return h;
}

test('countEntry names the count phase of the contract played', () => {
	const g = free('permesso_6', 6, 3);
	assert.equal(countEntry(g, 'sciolto').id, 'count_sciolto');
	assert.equal(countEntry(g, 'three').id, 'count');
	assert.equal(countEntry(g, null).id, 'count');
	// a game with one count phase: always that one
	assert.equal(countEntry(loadGame('meno', getFile, { seats: 3 }), 'x').module, 'count');
});

for (const [id, seats] of [['permesso_6', 6], ['permesso_7', 7]]) {
	for (const group of [1, 2, 3]) {
		test(`${id}: free game counted by ${group}: the score lines explain the total of every seat`, () => {
			const g = free(id, seats, group);
			for (let d = 0; d < 3; d++) {
				const h = playOut(g, `fg${group}${d}`, d % seats);
				const v = h.view(0);
				assert.equal(v.result.contract, 'sciolto');
				const sl = v.scoreLines;
				const line = (k) => sl.lines.find((l) => l.key === k);
				assert.equal(line('groups').rule, 'hand.phases[count_sciolto].settings.group');
				assert.equal(line('odd_card').rule, 'hand.phases[count_sciolto].settings.odd_card');
				// revision 14: at six there is no discard and no row for it; at seven there is one
				assert.equal(line('discard') !== undefined, id === 'permesso_7', id);
				for (const u of sl.units) {
					// the cards of the groups plus the Fool's card and the discard (where there is one) are the whole count of the seat
					const sum = line('groups').values[u.id] + line('fool_card').values[u.id] + (line('discard') ? line('discard').values[u.id] : 0);
					assert.equal(sum, sl.totals[u.id], `${id} group ${group} deal ${d} ${u.id}`);
				}
				// the groups line is the count of the cards the seat took, by the group of the agreement
				for (const u of sl.units) {
					const seat = u.seats[0];
					const cards = [];
					for (const t of v.tricks) for (const c of t.cards) if (t.winner === seat && c.card !== 'T0') cards.push(c.card);
					if (v.tricks.some((t) => t.fool === seat)) cards.push('T0');
					const ctx = ctxOf(g);
					const own = pointsOfCards(ctx, cards, 'sciolto');
					assert.equal(own * 12, countTwelfths(cards, { table: g.tables.values, group, oddCard: 'half_point', plainValue: 1 }), 'the bot counts by the group of the free game');
				}
			}
		});
	}
}

test('the bot counts a Permesso contract in pairs and the free game by the agreement', () => {
	const g = free('permesso_6', 6, 3);
	const ctx = ctxOf(g);
	const cards = ['coins:K', 'coins:2', 'coins:3', 'cups:K', 'T20'];
	const pairs = pointsOfCards(ctx, cards, 'three');
	const threes = pointsOfCards(ctx, cards, 'sciolto');
	assert.equal(pairs, countTwelfths(cards, { table: g.tables.values, group: 2, oddCard: 'half_point', plainValue: 1 }) / 12);
	assert.equal(threes, countTwelfths(cards, { table: g.tables.values, group: 3, oddCard: 'half_point', plainValue: 1 }) / 12);
	assert.notEqual(pairs, threes);
});

test('ownPoints of a view follows the contract of the hand', () => {
	const g = free('permesso_6', 6, 1);
	const ctx = ctxOf(g);
	const h = playOut(g, 'own', 0);
	const v = h.view(1);
	delete v.points;
	const mine = [];
	for (const t of v.tricks) for (const c of t.cards) if (t.winner === 1 && c.card !== 'T0') mine.push(c.card);
	if (v.tricks.some((t) => t.fool === 1)) mine.push('T0');
	assert.equal(ownPoints(ctx, v), countTwelfths(mine, { table: g.tables.values, group: 1, oddCard: 'half_point', plainValue: 1 }) / 12);
});
