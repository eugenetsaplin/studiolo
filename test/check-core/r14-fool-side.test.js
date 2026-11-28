// Revision 14, the Fool's exchange: no card is given, nobody is asked, no event, when the one who took the trick is on
// the owner's side and the side counts one heap.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../core/index.js';
import { load, newH } from './lib.mjs';

// the policy of the checks: seeded, never an a monte proposal, the first card offered for the Fool
function play(h, seed, onAction) {
	const rng = makeRng('v1:' + seed);
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 4000) throw new Error('the hand does not end');
		const seat = h.toAct()[0];
		const legal = h.legal(seat);
		const ok = legal.filter((a) => a.type !== 'a_monte_propose');
		const pool = ok.length ? ok : legal;
		const a = legal[0].type === 'fool_give' ? legal[0] : pool[rng.int(pool.length)];
		const r = h.apply(seat, a);
		assert.ok(r.ok, 'refused ' + JSON.stringify(a));
		if (onAction) onAction(h, seat, a, r);
	}
	return h;
}

const SIDES = [['partita_4', 4], ['consiglio', 4], ['permesso_3', 3], ['permesso_5', 5], ['chiamare_il_re', 4]];

test('the Fool: a partner who took the trick gets no card and nobody is asked (pooled sides)', () => {
	for (const [id, n] of SIDES) {
		const g = load(id, n);
		let same = 0;
		let other = 0;
		for (let i = 0; i < 120; i++) {
			const h = newH(g, `r14a-${id}-${i}`, i % n);
			let asked = 0;
			let given = 0;
			play(h, `r14a${id}${i}`, (hh, seat, a, r) => {
				if (a.type === 'fool_give') asked++;
				for (const e of r.events || []) if (e.e === 'fool_given') given++;
			});
			const sn = h.snapshot();
			const t = sn.tricks.find((x) => x.fool !== null);
			if (!t) continue;
			const sides = h.sides();
			if (sides.of[t.fool] === sides.of[t.winner]) {
				same++;
				assert.equal(asked, 0, `${id}/${i}: the owner was asked for a card to give inside his side`);
				assert.equal(given, 0, `${id}/${i}: a fool_given event inside the side`);
				assert.equal(sn.foolGive, null, `${id}/${i}: foolGive is set inside the side`);
				const bd = h.result().breakdown[t.fool];
				assert.equal(bd.fool, 0, `${id}/${i}: the Fool line is not nil`);
			} else {
				other++;
				assert.equal(given, 1, `${id}/${i}: the other side gets one card for the Fool`);
			}
		}
		assert.ok(same > 5 && other > 5, `${id}: both cases are met (${same}/${other})`);
	}
});
