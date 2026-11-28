// The rows of the score panel after a hand (view.scoreLines) add up to the total of the side: the rows counted in twelfths of a point
// (the groups, the card for the Fool, the discard, the stock cards) sum to the points of the unit in every hand. `odd_card` is a part
// of the groups row and is not added (CORE_API.md section 3). Morto (stock), Mitigati for two (discard) and Bagatt'ultimo (card for
// the Fool, discard) lacked rows in their files until revision 14.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlayers, playTable } from '../../tools/botlab/table.mjs';
import { scoreLines } from '../../core/score.js';

const ROWS = new Set(['groups', 'pairs', 'fool_card', 'discard', 'stock_cards']);

async function check(id, seats, hands) {
	const players = await resolvePlayers(new Array(seats).fill('random'));
	let n = 0;
	for (let h = 0; h < hands; h++) {
		const t = playTable({ id, seats, seed: 'score-rows', h }, players);
		assert.ok(t.finished, `${id} hand ${h}`);
		const sl = scoreLines(t.game, t.hand.view(0));
		if (!sl || !sl.lines.length) continue;
		n++;
		for (const u of sl.units) {
			let sum = 0;
			for (const l of sl.lines) if (l.unit === 'twelfths' && l.by === 'unit' && ROWS.has(l.key)) sum += l.values[u.id] || 0;
			assert.equal(sum, sl.totals[u.id], `${id}, hand ${h}, ${u.id}: the rows add up to ${sum}, the total is ${sl.totals[u.id]}`);
		}
	}
	assert.ok(n > hands / 2, `${id}: hands with rows`);
}

test('Morto: the rows (with the stock cards) add up to the total of the seat', () => check('morto', 2, 100));
test('Mitigati for two: the rows (with the discard) add up to the total of the seat', () => check('mitigati_2', 2, 100));
test("Bagatt'ultimo: the rows (with the card for the Fool and the discard) add up to the total of the seat", () => check('bagattultimo', 3, 100));
