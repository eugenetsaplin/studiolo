// Shared by the race and piles bot tests: the three games for two, and a walk through random hands.
import { newHand, makeRng } from '../../core/index.js';
import { game, level } from './lib.mjs';

export { game, level };
export const TWO_SEAT_RACE = [['sedici_2', 2], ['trentuno', 2], ['baronetti', 2]];
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Plays random hands of a game; calls visit(hand, seat) before each `every`-th action. A claim is made only when it
// is valid, so the walk reaches deep positions. Stops after `max` visits.
export function walk(g, seed, max, visit, every = 1) {
	let seen = 0;
	for (let d = 0; seen < max && d < 400; d++) {
		const h = newHand(g, { seed: `${seed}${d}`, dealer: d % g.seats });
		const rng = makeRng(`${seed}r${d}`);
		let k = 0;
		while (!h.isOver() && seen < max) {
			const q = h.toAct()[0];
			const v = h.view(q);
			const legal = h.legal(q).filter((a) => a.type !== 'claim_fuora' || (v.points && v.fuora && v.points.mine >= v.fuora.target));
			if (k++ % every === 0) { visit(h, q); seen++; }
			h.apply(q, legal[rng.int(legal.length)]);
		}
	}
	return seen;
}
