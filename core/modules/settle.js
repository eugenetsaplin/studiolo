// settle: the payments of the hand, from the result. Units are whole stakes; the core never rounds a stake.
// Order of the payments: those made by events (declarations, settle.payments), the false «fuora» claims, then the
// payments of the mode. A declarer game pays the declarer against each opponent (declarer_vs_each); a pair game with
// unequal sides plays the same way. The band of the result decides how much of the amount is paid (full, the Onoranza
// alone, nothing).
import { isObj, seatAt } from '../util.js';
import { handPayments, paymentsSupport } from './payments.js';

export const name = 'settle';
export const version = '1.1.0';

const ROUNDS = ['down', 'up', 'nearest_half_down', 'nearest_half_up', 'none', 'toward_zero'];

function perPointsOk(p) {
	return isObj(p) && p.of === 'declarer_side' && typeof p.from === 'number' && typeof p.every === 'number' && p.every > 0
		&& typeof p.unit === 'number' && ROUNDS.includes(p.round) && (p.direction === undefined || p.direction === 'both');
}

function amountOk(v, ctx) {
	if (typeof v === 'number') return true;
	if (!isObj(v)) return false;
	if ('stake' in v) return ['simple', 'double', 'marcia', 'agreed'].includes(v.stake);
	if ('option' in v) return (ctx.rules.options || []).some((o) => o.id === v.option);
	if ('contract' in v) return typeof v.contract === 'string' && (ctx.rules.contracts || []).length > 0 && (ctx.rules.contracts || []).every((c) => typeof c[v.contract] === 'number' || c[v.contract] === undefined);
	if ('per_points' in v) return perPointsOk(v.per_points) && ctx.phases.some((p) => p.module === 'bidding');
	if ('sum' in v) return Array.isArray(v.sum) && v.sum.every((x) => amountOk(x, ctx));
	if ('times' in v) return Array.isArray(v.times) && v.times.every((x) => amountOk(x, ctx));
	return false;
}

export const supports = {
	unit: ['stake', 'marca', 'soldo'],
	mode: ['loser_pays_winner', 'losers_pay_winner', 'winners_from_losers', 'pair_split', 'declarer_vs_each'],
	amount: (v, ctx) => amountOk(v, ctx) || 'only numbers, stake, option, contract, per_points, sum and times amounts are played',
	premiums: [[]],
	payments: paymentsSupport,
};

// steps of `every` points between the points made and `from`: whole steps, rounded as `round` says (on the value scale)
export function stepsOf(twelfths, p) {
	return rawSteps(twelfths, p) + 0;
}

function rawSteps(twelfths, p) {
	const a = twelfths - Math.round(p.from * 12);
	const b = Math.round(p.every * 12);
	switch (p.round) {
		case 'down': return Math.floor(a / b);
		case 'up': return Math.ceil(a / b);
		case 'nearest_half_up': return Math.floor((2 * a + b) / (2 * b));
		case 'none': return a / b;
		case 'toward_zero': return Math.trunc(a / b); // whole steps from the line, a part of a step counts for nothing on either side
		default: return Math.ceil((2 * a - b) / (2 * b)); // nearest_half_down: 47.5 is 45, 42.5 is 40
	}
}

// the amount of an expression. `h` (a hand) is needed for contract and per_points amounts. `skip`: parts left out
// ('points' leaves per_points out: the Onoranza alone).
export function amountOf(v, options, h, skip) {
	if (typeof v === 'number') return v;
	if ('stake' in v) {
		const simple = options.stake !== undefined ? options.stake : 1;
		return v.stake === 'double' || v.stake === 'marcia' ? 2 * simple : simple;
	}
	if ('option' in v) return options[v.option];
	if ('contract' in v) {
		const c = h && h.contractById(h.s.contract);
		return c && typeof c[v.contract] === 'number' ? c[v.contract] : 0;
	}
	if ('per_points' in v) {
		if (skip === 'points' || !h) return 0;
		const p = v.per_points;
		const sd = h.sides().of[h.s.declarer];
		return Math.abs(stepsOf(h.s.m.count.sidePoints[sd], p)) * p.unit;
	}
	if ('sum' in v) return v.sum.reduce((a, x) => a + amountOf(x, options, h, skip), 0);
	return v.times.reduce((a, x) => a * amountOf(x, options, h, skip), 1);
}

// the parts of an amount with the reason of each: the Onoranza and the points are shown apart
function partsOf(v, mode) {
	const list = isObj(v) && 'sum' in v ? v.sum : [v];
	return list.map((x) => ({ why: isObj(x) && 'contract' in x && x.contract === 'onoranza' ? 'onoranza' : isObj(x) && 'per_points' in x ? 'points' : mode, value: x }));
}

// who pays whom for a mode that pays winners by losers: loser_pays_winner takes the payers from `worst` (all the losers when it
// is empty), losers_pay_winner and winners_from_losers take every loser, pair_split pairs each winner with the next loser.
// Shared by the hand (above) and by the match that pays once at its end.
export function payPairs(mode, winners, losers, worst, n) {
	const pairs = [];
	if (mode === 'pair_split') {
		const used = new Set();
		for (const w of winners) {
			let pick = null;
			for (let i = 1; i < n && pick === null; i++) {
				const q = seatAt(w, i, n);
				if (losers.includes(q) && !used.has(q)) pick = q;
			}
			if (pick === null) pick = losers[0];
			used.add(pick);
			pairs.push({ from: pick, to: w });
		}
	} else {
		const payers = mode === 'loser_pays_winner' ? (worst && worst.length ? worst : losers) : losers;
		for (const p of payers) for (const w of winners) pairs.push({ from: p, to: w });
	}
	return pairs;
}

export function enter(h) {
	const s = h.s;
	const set = h.cur.set;
	const r = s.result;
	const events = [];
	const options = h.game.options;
	const mode = set.mode || 'loser_pays_winner';
	const winners = r.winners;
	const add = (from, to, amount, why) => {
		r.payments.push({ from, to, amount, why });
		if (why !== 'declaration') events.push({ e: 'paid', from, to, amount, why });
	};
	// the payments of events: declarations first, then settle.payments
	for (const p of handPayments(h, set)) add(p.from, p.to, p.amount, p.why);
	// the payments of false «fuora» claims (a fuora hook): the claimer pays each other seat, whoever wins the hand
	const f = s.m.fuora;
	for (const c of (f && f.claims) || []) {
		if (c.valid || !c.stake) continue;
		const a = amountOf({ stake: c.stake }, options);
		for (let q = 0; q < s.n; q++) if (q !== c.seat && a) add(c.seat, q, a, 'false_claim');
	}
	const raw = set.amount === undefined ? { stake: 'simple' } : set.amount;
	const pays = r.band ? r.band.pays : 'full';
	const skip = pays === 'onoranza_only' ? 'points' : null;
	const amount = pays === 'nothing' ? 0 : amountOf(raw, options, h, skip);
	// a false «fuora» that lost the hand was paid by its row, the lost game itself: no second payment for the win
	const paidByRow = !!(f && f.claims.some((c) => c.ends && c.stake));
	const decide = !paidByRow && winners.length && r.outcome !== 'tie' && r.outcome !== 'draw' && r.outcome !== 'thrown_in';
	const losers = [];
	for (let q = 0; q < s.n; q++) if (!winners.includes(q)) losers.push(q);
	const sideOf = h.sides().of;
	// the declarer's side wins or loses: the declarer collects from each opponent or pays each
	const declarerPays = (rows) => {
		const d = s.declarer;
		const wins = winners.includes(d);
		const opp = [];
		for (let q = 0; q < s.n; q++) if (sideOf[q] !== sideOf[d]) opp.push(q);
		for (const part of rows) {
			const a = pays === 'nothing' ? 0 : amountOf(part.value, options, h, skip);
			if (!a) continue;
			for (const q of opp) { if (wins) add(q, d, a, part.why); else add(d, q, a, part.why); }
		}
	};
	// match.payout match_end: the stake of the hand is not paid here, the match pays once at its end (core/match.js)
	const mp = h.game.cfg && h.game.cfg.match ? h.game.cfg.match.payout : undefined;
	const atMatchEnd = mp === 'match_end' || (isObj(mp) && (mp.at === undefined || mp.at === 'match_end'));
	if (decide && !atMatchEnd) {
		const unequal = mode === 'pair_split' && winners.length !== losers.length && s.declarer !== null;
		if (mode === 'declarer_vs_each' || unequal) {
			if (s.declarer !== null) declarerPays(partsOf(raw, 'declarer_vs_each'));
		} else if (amount) {
			const pairs = payPairs(mode, winners, losers, r.worst, s.n);
			for (const p of pairs) add(p.from, p.to, amount, mode);
		}
	}
	return { events, done: true };
}

export function toAct() { return []; }
export function legal() { return []; }
export function apply() { return { ok: false }; }
