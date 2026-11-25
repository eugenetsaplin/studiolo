// Helpers of the race and piles core tests: Sedici and Trent'uno scenes with a known number of won points.
import { newHand, makeRng, cardTwelfths } from '../../core/index.js';
import { livePoints } from '../../core/modules/count.js';
import { load, build } from './helpers.js';
import { chooseAction } from '../../bots/random.js';

export { load, livePoints, makeRng };

// the book value of a card as the count of this game counts it (each card alone)
export function valueOf(game, card) {
	const e = game.plan.find((x) => x.module === 'count');
	return cardTwelfths(game.tables.values, card, 1, e.set.plain_value) / 12;
}

// a deal where seat 1 leads `lead` and seat 0 answers `answer`; the dealer is seat 0
export function scene(game, lead, answer) {
	const size = game.plan.find((x) => x.module === 'deal').set.hand_size;
	const p = build([size, size], [[answer], [lead]]);
	return newHand(game, { seed: 'c3', dealer: 0, preset: p });
}

// cards of the undealt pack that make exactly `points` book points, moved into the won cards of `seat`
export function giveWon(h, seat, points) {
	const g = h.game;
	// subset sum over the valued cards of the pack, fewest valuable cards first
	const cards = h.s.rest.filter((c) => valueOf(g, c) > 0).sort((a, b) => valueOf(g, b) - valueOf(g, a));
	const best = new Map([[0, []]]);
	for (const c of cards) {
		const v = valueOf(g, c);
		for (const [sum, pick] of [...best]) if (sum + v <= points && !best.has(sum + v)) best.set(sum + v, [...pick, c]);
	}
	const take = best.get(points);
	if (!take) throw new Error('cannot make ' + points + ' points');
	h.s.rest = h.s.rest.filter((c) => !take.includes(c));
	h.s.won[seat].push(...take);
	return take;
}

// plays the opening trick of a scene: seat 1 leads, seat 0 answers
export function playFirstTrick(h, lead, answer) {
	if (!h.apply(1, { type: 'play', card: lead }).ok) throw new Error('lead refused');
	if (!h.apply(0, { type: 'play', card: answer }).ok) throw new Error('answer refused');
	return h;
}

// plays at random to the end, claiming only when `claim(h, seat)` says so
export function playOut(h, rng, claim = () => false) {
	let guard = 0;
	while (!h.isOver()) {
		if (guard++ > 5000) throw new Error('a hand does not end');
		const toAct = h.toAct();
		const seat = toAct[rng.int(toAct.length)];
		const legal = h.legal(seat);
		const claimA = legal.find((a) => a.type === 'claim_fuora');
		let a;
		if (claimA && claim(h, seat)) a = claimA;
		else {
			const rest = legal.filter((x) => x.type !== 'claim_fuora');
			a = rest.length ? chooseAction(rest, rng) : claimA;
		}
		const r = h.apply(seat, a);
		if (!r.ok) throw new Error('refused ' + JSON.stringify(r));
	}
	return h;
}

export const targetOf = (game) => game.hooks.tricks.find((e) => e.module === 'fuora').set.target;

// claims exactly when the claim is right
export const claimWhenRight = (h, seat) => livePoints(h, seat) >= targetOf(h.game);
