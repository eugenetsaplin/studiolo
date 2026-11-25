// The match: hands one after another. The hand seed is seed + ":" + handIndex (the first hand is index 0); the
// dealer moves by seats.dealer_rotation. Kinds: single_hand, fixed_hands, race, running_total, ledger
// (a thrown-in hand or a drawn one (outcome thrown_in, draw) counts as a dealt hand: nobody pays, the dealer follows seats.dealer_rotation; only a tied hand of a race is dealt again by the same dealer)
// (match.payout match_end: the hands pay no stake; one payment at the end of the match, from the losers to the winners of the match,
// standing.payments and view.match.payments; per_hand, the default, pays every hand as its settle phase says)
// (a race counts game points: a hand with no winner has the outcome none and scores nothing, and the dealer then moves right;
// a ledger match with dealer_rounds ends after dealer_rounds x seats hands; the greatest balance wins, equal greatest balances are a draw).
import { newHand } from './engine.js';
import { makeRng } from './rng.js';
import { seatAt, isObj } from './util.js';
import { amountOf, payPairs } from './modules/settle.js';

function kindOf(m) {
	if (m.kind) return m.kind;
	if (m.hands === undefined) return 'single_hand';
	return m.hands > 0 ? 'fixed_hands' : 'race';
}

export class Match {
	constructor(game, seed, firstDealer, preset = null) {
		this.game = game;
		this.seed = String(seed);
		this.n = game.seats;
		const mc = game.cfg.match || {};
		this.kind = kindOf(mc);
		this.mc = mc;
		const fw = game.plan.find((e) => e.module === 'result');
		this.lowWins = !!(fw && fw.set.winner === 'fewest_points');
		this.dealer = Number.isInteger(firstDealer) ? firstDealer : makeRng(this.seed + ':dealer').int(this.n);
		this.handIndex = 0;
		this.done = [];
		this.hand = this._start(null, this.handIndex, this.dealer, preset);
	}

	_start(lastTaker, handIndex, dealer, preset = null) {
		const carry = { match: { kind: this.kind, handIndex } };
		if (lastTaker !== null) carry.lastTaker = lastTaker;
		const init = { seed: this.seed + ':' + handIndex, dealer, carry };
		if (preset) init.preset = preset;
		return newHand(this.game, init);
	}

	// The number of hands of the match when it is known before play: one, match.hands, match.rounds, or
	// dealer_rounds x seats for a ledger with an end; null for a race (tied hands are dealt again) and an open ledger.
	handCount() {
		const mc = this.mc;
		switch (this.kind) {
			case 'single_hand': return 1;
			case 'fixed_hands': return mc.hands || 1;
			case 'running_total': return mc.rounds || 1;
			case 'ledger': return Number.isInteger(mc.dealer_rounds) && mc.dealer_rounds >= 1 ? mc.dealer_rounds * this.n : null;
			default: return null;
		}
	}

	_results() {
		const out = this.done.slice();
		if (this.hand.isOver()) out.push(this.hand.result());
		return out;
	}

	isOver() {
		if (!this.hand.isOver()) return false;
		const res = this._results();
		const mc = this.mc;
		switch (this.kind) {
			case 'single_hand': return true;
			case 'fixed_hands': return res.length >= (mc.hands || 1);
			case 'running_total': return res.length >= (mc.rounds || 1);
			case 'race': {
				const gp = this._gamePoints(res);
				if (res.length >= (mc.max_hands || 60)) return true;
				if (Math.max(...Object.values(gp)) < (mc.target || 5)) return false;
				// level leaders at or above the target: another game is played, until one side leads alone
				const sides = this.game.sides;
				const ids = [...new Set(Array.from({ length: this.n }, (_, q) => sides.of[q]))];
				const sums = ids.map((id) => Object.keys(gp).filter((q) => sides.of[q] === id).reduce((a, q) => a + gp[q], 0));
				const best = Math.max(...sums);
				return sums.filter((v) => v === best).length === 1;
			}
			default: // ledger: without dealer_rounds the table ends it; with it the match ends after that many rounds of dealers
				return Number.isInteger(mc.dealer_rounds) && mc.dealer_rounds >= 1 && res.length >= mc.dealer_rounds * this.n;
		}
	}

	_gamePoints(res) {
		const gp = {};
		for (let q = 0; q < this.n; q++) gp[q] = 0;
		for (const r of res) for (let q = 0; q < this.n; q++) gp[q] += r.gamePoints[q] || 0;
		return gp;
	}

	standing() {
		const res = this._results();
		const gp = this._gamePoints(res);
		const totals = {};
		const ledger = {};
		for (let q = 0; q < this.n; q++) { totals[q] = 0; ledger[q] = 0; }
		for (const r of res) {
			for (let q = 0; q < this.n; q++) {
				totals[q] += this.kind === 'running_total' ? (r.points[q] || 0) - (this.mc.round_target || 0) * 12 : (r.points[q] || 0);
			}
			for (const p of r.payments) { ledger[p.from] -= p.amount; ledger[p.to] += p.amount; }
		}
		let winners = null;
		const out = { kind: this.kind, hands: res, gamePoints: gp, totals, ledger, winners };
		if (this.isOver()) {
			out.winners = this._winners(res, gp, totals, ledger);
			// the payment of the match, paid once at its end; the key is there only when the file asks for it
			if (this.payout()) {
				out.payments = this._payments(out.winners, this._worst(gp, totals, out.winners));
				for (const p of out.payments) { ledger[p.from] -= p.amount; ledger[p.to] += p.amount; }
			}
		} else if (this.payout()) out.payments = [];
		return out;
	}

	// the payout of the file: null (per_hand) or {mode, amount} (match_end; what the key leaves out comes from the settle phase)
	payout() {
		const p = this.mc.payout;
		if (p !== 'match_end' && !(isObj(p) && (p.at === undefined || p.at === 'match_end'))) return null;
		const e = this.game.plan.find((x) => x.module === 'settle');
		const set = (e && e.set) || {};
		const q = isObj(p) ? p : {};
		let mode = q.mode !== undefined ? q.mode : set.mode;
		if (!['loser_pays_winner', 'losers_pay_winner', 'winners_from_losers', 'pair_split'].includes(mode)) mode = 'loser_pays_winner';
		const amount = q.amount !== undefined ? q.amount : (set.amount === undefined ? { stake: 'simple' } : set.amount);
		return { mode, amount };
	}

	// the seats that did worst in a match that has winners: the lowest total of a running total, else the sides lowest by game points
	// (and by card points when the match has the card_points tiebreak); winners are never among them
	_worst(gp, totals, winners) {
		const seats = Array.from({ length: this.n }, (_, i) => i);
		if (!winners || !winners.length) return [];
		if (this.kind === 'running_total') {
			const rest = seats.filter((q) => !winners.includes(q));
			const low = Math.min(...rest.map((q) => totals[q]));
			return rest.filter((q) => totals[q] === low);
		}
		const sides = this.game.sides;
		const ids = [...new Set(seats.map((q) => sides.of[q]))];
		const sum = (score, id) => seats.filter((q) => sides.of[q] === id).reduce((a, q) => a + score[q], 0);
		const key = (id) => [sum(gp, id), this.mc.tiebreak === 'card_points' ? (this.lowWins ? -1 : 1) * sum(totals, id) : 0];
		const rest = ids.filter((id) => !winners.some((q) => sides.of[q] === id));
		const less = (a, b) => (a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1]);
		let low = key(rest[0]);
		for (const id of rest) if (less(key(id), low)) low = key(id);
		const lowIds = rest.filter((id) => key(id)[0] === low[0] && key(id)[1] === low[1]);
		return seats.filter((q) => lowIds.includes(sides.of[q]));
	}

	_payments(winners, worst) {
		const po = this.payout();
		if (!po || !winners || !winners.length) return [];
		const losers = Array.from({ length: this.n }, (_, i) => i).filter((q) => !winners.includes(q));
		const amount = amountOf(po.amount, this.game.options);
		if (!amount) return [];
		return payPairs(po.mode, winners, losers, worst, this.n).map((p) => ({ from: p.from, to: p.to, amount, why: po.mode }));
	}

	_winners(res, gp, totals, ledger) {
		const seats = Array.from({ length: this.n }, (_, i) => i);
		const top = (score, better) => {
			const best = better(...seats.map((q) => score[q]));
			return seats.filter((q) => score[q] === best);
		};
		if (this.kind === 'single_hand') return res[0].winners.slice();
		if (this.kind === 'running_total') {
			const best = Math.max(...seats.map((q) => totals[q]));
			return best > 0 ? seats.filter((q) => totals[q] === best) : [];
		}
		// sides compete, not seats: partners are always equal, so a pair match is decided between the sides
		const sides = this.game.sides;
		const ids = [...new Set(seats.map((q) => sides.of[q]))];
		const sum = (score, id) => seats.filter((q) => sides.of[q] === id).reduce((a, q) => a + score[q], 0);
		const side = (score, better, from) => {
			const best = better(...from.map((id) => sum(score, id)));
			return from.filter((id) => sum(score, id) === best);
		};
		// a ledger match is decided by the balance of the marche; the others by game points
		let w = side(this.kind === 'ledger' ? ledger : gp, Math.max, ids);
		if (w.length > 1 && this.mc.tiebreak === 'card_points') w = side(totals, this.lowWins ? Math.min : Math.max, w);
		return w.length > 1 ? [] : seats.filter((q) => sides.of[q] === w[0]);
	}

	// opts.preset: the next hand is dealt from it (newHand); opts.dealer: that seat deals it instead of the rotation.
	// A preset the deal refuses throws and leaves the match as it was.
	next(opts = {}) {
		if (!this.hand.isOver()) throw new Error('the hand is not over');
		if (this.isOver()) throw new Error('the match is over');
		const r = this.hand.result();
		const tricks = this.hand.s.tricks;
		const lastTaker = tricks.length ? tricks[tricks.length - 1].winner : null;
		const n = this.n;
		const rot = this.game.cfg.seats.dealer_rotation || 'right';
		let d = this.dealer;
		const tied = r.outcome === 'tie';
		if (this.kind === 'race' && tied && this.mc.tie_replay !== false) { /* a tied hand is dealt again by the same dealer */ }
		else if (rot === 'loser_deals') d = r.worst && r.worst.length ? r.worst[0] : seatAt(d, 1, n);
		else if (rot === 'winner_passes_to_companion') d = r.winners && r.winners.length ? seatAt(r.winners[0], 1, n) : seatAt(d, 1, n);
		else if (rot === 'left') d = seatAt(d, -1, n);
		else if (rot === 'same') { /* the same dealer */ }
		else d = seatAt(d, 1, n);
		if (opts.dealer !== undefined && opts.dealer !== null) {
			if (!Number.isInteger(opts.dealer) || opts.dealer < 0 || opts.dealer >= n) throw new Error('bad dealer');
			d = opts.dealer;
		}
		const hand = this._start(lastTaker, this.handIndex + 1, d, opts.preset || null);
		this.done.push(r);
		this.dealer = d;
		this.handIndex++;
		this.hand = hand;
		return this.hand;
	}

	// The view of a seat with the match: its kind, the index of the hand, the standing (only finished hands),
	// handCount (null when not known before play) and target (a race only, else null).
	view(seat) {
		const v = this.hand.view(seat);
		v.match = {
			kind: this.kind, handIndex: this.handIndex, standing: this.standing(),
			handCount: this.handCount(), target: this.kind === 'race' ? (this.mc.target || 5) : null,
		};
		// the payment of the match (match.payout match_end): [] until the match is over; no such field for a file that pays per hand
		if (this.payout()) v.match.payments = v.match.standing.payments;
		return v;
	}
}

// opts: {seed, firstDealer, preset} (preset: the first hand is dealt from it, as newHand takes it).
export function newMatch(game, opts = {}) {
	if (!game.support.runnable) throw new Error('the game has rules the core does not play; see support.missing');
	return new Match(game, opts.seed === undefined ? '' : opts.seed, opts.firstDealer, opts.preset || null);
}
