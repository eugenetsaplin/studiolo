// result: who won the hand, from the points of the sides (twelfths). Winners are seats; a side's seats win together.
// tie: share (more_points, fewest_points): equal best sides all win together; only a hand where every side is level is a tie.
import { seatsOfSide } from '../util.js';
import { falseClaimPoints } from './fuora.js';

export const name = 'result';
export const version = '1.0.0';

export const supports = {
	winner: ['more_points', 'fewest_points', 'threshold', 'first_out', 'declarer_threshold'],
	target: (v) => typeof v === 'number' || 'must be a number',
	tie: ['no_game_points', 'draw', 'redeal_next_dealer', 'declarer_loses', 'share'],
	bands: (v) => bandsOk(v) || 'bands: a list of {min, max, outcome win|draw|loss, pays full|onoranza_only|nothing}',
	game_points: ['one', 'none', 'one_or_two_dry'],
	shut_num: '*',
	shut_den: '*',
};

function bandsOk(v) {
	if (!Array.isArray(v) || !v.length) return false;
	return v.every((b) => b && typeof b === 'object' && ['win', 'draw', 'loss'].includes(b.outcome) && ['full', 'onoranza_only', 'nothing'].includes(b.pays)
		&& (b.min === undefined || typeof b.min === 'number') && (b.max === undefined || typeof b.max === 'number'));
}

// the band of the declarer's points (in twelfths): the first row that holds them, else the nearest row below
export function bandOf(bands, twelfths) {
	const inRow = (b) => (b.min === undefined || twelfths >= Math.round(b.min * 12)) && (b.max === undefined || twelfths <= Math.round(b.max * 12));
	const hit = bands.find(inRow);
	if (hit) return hit;
	const below = bands.filter((b) => b.min !== undefined && twelfths >= Math.round(b.min * 12)).sort((a, b) => b.min - a.min)[0];
	return below || bands[bands.length - 1];
}

// first_out needs a fuora phase: without it no hand could have a winner; declarer_threshold needs a bidding phase
export function check(set, ctx) {
	if (set.winner === 'declarer_threshold' && !ctx.phases.some((p) => p.module === 'bidding')) {
		return [{ key: 'winner', value: 'declarer_threshold', why: 'declarer_threshold needs a bidding phase' }];
	}
	if (set.winner === 'first_out' && !ctx.phases.some((p) => p.module === 'fuora')) {
		return [{ key: 'winner', value: 'first_out', why: 'first_out needs a fuora phase' }];
	}
	return [];
}

export function enter(h) {
	const s = h.s;
	const set = h.cur.set;
	const sides = h.sides();
	const c = s.m.count;
	const ids = Object.keys(c.sidePoints).map(Number);
	const sp = c.sidePoints;
	const winner = set.winner || 'more_points';
	let winSides = [];
	let outcome;
	let reason;
	let band = null;
	const declSide = s.declarer !== null ? sides.of[s.declarer] : null;
	if (winner === 'declarer_threshold') {
		const target = (set.target || 0) * 12;
		const mine = sp[declSide];
		const row = set.bands ? bandOf(set.bands, mine) : { outcome: mine >= target ? 'win' : 'loss', pays: 'full' };
		band = { outcome: row.outcome, pays: row.pays };
		if (row.outcome === 'win') winSides = [declSide];
		else if (row.outcome === 'loss') winSides = ids.filter((i) => i !== declSide);
		outcome = row.outcome === 'draw' ? 'draw' : 'win';
	} else if (winner === 'first_out') {
		// the seat that went out (a valid fuora) wins; a hand with no claim has no winner
		const f = s.m.fuora;
		let seats = [];
		if (s.out !== null) { seats = [s.out.seat]; reason = 'fuora'; }
		else if (f && f.ended) {
			// a false claim that ends the hand loses it: every seat of the other sides wins
			const lost = sides.of[f.ended.seat];
			for (let q = 0; q < s.n; q++) if (sides.of[q] !== lost) seats.push(q);
			reason = 'false_claim';
		}
		else reason = 'stock_empty';
		winSides = [...new Set(seats.map((q) => sides.of[q]))];
		outcome = winSides.length ? 'win' : 'none';
	} else if (winner === 'threshold') {
		winSides = ids.filter((id) => sp[id] >= (set.target || 0) * 12);
		outcome = winSides.length ? 'threshold' : 'none';
		// equal points with a declarer: the declarer's side loses, the others win
		if (!winSides.length && set.tie === 'declarer_loses' && declSide !== null) { winSides = ids.filter((i) => i !== declSide); outcome = 'threshold'; }
	} else {
		const best = winner === 'fewest_points' ? Math.min(...ids.map((i) => sp[i])) : Math.max(...ids.map((i) => sp[i]));
		winSides = ids.filter((i) => sp[i] === best);
		if (winSides.length === ids.length && ids.length > 1) { outcome = 'tie'; winSides = []; }
		else if (winSides.length > 1) {
			// share: equal best sides all win (a hand where every side is level is still a tie, handled above)
			if (set.tie === 'share') outcome = 'win';
			else { outcome = 'tie'; winSides = []; }
		}
		else outcome = 'win';
		if (outcome === 'tie' && set.tie === 'redeal_next_dealer') outcome = 'draw';
	}
	const worstVal = winner === 'declarer_threshold' ? 0 : winner === 'first_out' ? 0 : winner === 'fewest_points' ? Math.max(...ids.map((i) => sp[i])) : Math.min(...ids.map((i) => sp[i]));
	const worstSides = outcome === 'tie' || outcome === 'draw' || winner === 'first_out' || winner === 'declarer_threshold' ? [] : ids.filter((i) => sp[i] === worstVal && !winSides.includes(i));
	const winners = winSides.flatMap((id) => seatsOfSide(sides, id)).sort((a, b) => a - b);
	const worst = worstSides.flatMap((id) => seatsOfSide(sides, id)).sort((a, b) => a - b);
	const gamePoints = {};
	for (let q = 0; q < s.n; q++) gamePoints[q] = 0;
	if (winners.length && set.game_points !== 'none') {
		let gp = 1;
		if (set.game_points === 'one_or_two_dry' && outcome === 'win') {
			const others = ids.filter((i) => !winSides.includes(i)).map((i) => sp[i]);
			const loser = winner === 'fewest_points' ? Math.min(...others) : Math.max(...others);
			const win = sp[winSides[0]];
			if (loser * (set.shut_den || 3) <= win * (set.shut_num || 1)) gp = 2;
		}
		for (const q of winners) gamePoints[q] = gp;
	}
	// a false «fuora» that is paid in a race gives each other seat game points (two for a double row, one for a simple)
	if (winner === 'first_out' && set.game_points !== 'none') {
		const f = s.m.fuora;
		for (const c of (f && f.claims) || []) {
			if (c.valid || !c.stake || c.ends) continue; // a claim that ended the hand is paid by the lost game itself
			for (let q = 0; q < s.n; q++) if (q !== c.seat) gamePoints[q] += falseClaimPoints(c.stake);
		}
	}
	s.result = {
		points: { ...c.points }, sidePoints: { ...c.sidePoints }, winners, outcome, gamePoints, payments: [],
		breakdown: JSON.parse(JSON.stringify(c.breakdown)), worst,
	};
	if (winner === 'first_out') s.result.reason = reason;
	if (s.contract !== null) { s.result.contract = s.contract; s.result.declarer = s.declarer; }
	if (band) s.result.band = band;
	return { events: [{ e: 'result', outcome, winners: [...winners] }], done: true };
}

export function toAct() { return []; }
export function legal() { return []; }
export function apply() { return { ok: false }; }
