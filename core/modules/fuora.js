// fuora (a hook of tricks): going out of a game of repeated deals. The seat that has taken a trick may say «fuora» before
// anything else happens (claim_when after_trick); the engine counts its points aloud. Enough points: it is out and
// the hand ends. Too few: it pays the false_claim row and play goes on (after_false_claim play_on) or the hand ends
// and the claimer loses it (hand_ends).
// at_round_end deal_on (Torino 1787 prints no duty to say «fuora» at the end of a packet): the next packet is dealt and the
// claim waits for the claimer's own turn. Only when the pack is spent and no card will be played any more a last window
// opens: each seat in turn, from the taker of the last trick, says «fuora» (a right claim wins, a false one is paid) or
// pass_fuora. at_round_end must_claim (the old reading): the taker of the last trick of a packet who has the points must
// say «fuora» before the next deal, and a false claim there is not offered.
// winner_is first_reached (Prammatica [1846], p. 12): the winner is the first seat that made the points, whoever says it.
// after_first_out others_continue (Torino 1787, pp. 43-44, «a scaricare»): the first to go out lays his cards down, unseen,
// and wins; the other two play on, in tricks of two cards and with the packets dealt to the two. The second to go out ends
// the hand. The state keeps the first in s.out as before and the order of going out in s.outs. stock_empty others_pay_first:
// the pack runs out and no second has said «fuora»: there is no last, so both pay the first (hand_ends_no_winner still
// holds when nobody went out).
import { livePoints } from './count.js';
import { finishTrick } from './tricks.js';

export const name = 'fuora';
export const version = '1.0.0';
export const hook = 'tricks';

const STAKES = ['simple', 'marcia', 'double'];

function rowsOk(v) {
	if (!Array.isArray(v)) return 'false_claim is a list of rows';
	for (const r of v) {
		if (!r || typeof r !== 'object') return 'a row is an object';
		const lo = typeof r.from === 'number';
		const hi = typeof r.below === 'number';
		if (lo === hi) return 'a row has exactly one of from and below';
		if (!r.pays || !STAKES.includes(r.pays.stake)) return 'a row pays simple, marcia or double';
		if (r.to !== undefined && r.to !== 'each_other') return 'only each_other is paid';
	}
	return true;
}

export const supports = {
	target: (v) => (typeof v === 'number' && v > 0) || 'must be a positive number',
	claim_when: ['after_trick', 'own_turn'],
	false_claim: rowsOk,
	after_false_claim: ['play_on', 'hand_ends'],
	at_round_end: ['deal_on', 'must_claim'],
	winner_is: ['claimer', 'first_reached'],
	after_first_out: ['hand_ends', 'others_continue'],
	stock_empty: ['hand_ends_no_winner', 'others_pay_first'],
};

export function check(set, ctx) {
	const bad = [];
	if (!ctx.phase || ctx.phase.during !== 'tricks') bad.push({ key: 'target', value: set.target, why: 'fuora is a hook of tricks (during: tricks)' });
	if (set.target === undefined) bad.push({ key: 'target', value: null, why: 'target is required' });
	if (set.after_first_out === 'others_continue') {
		if (ctx.seats !== 3) bad.push({ key: 'after_first_out', value: set.after_first_out, why: 'others_continue is played at three seats' });
		if (set.winner_is === 'first_reached') bad.push({ key: 'winner_is', value: set.winner_is, why: 'others_continue is played with the claimer as the winner' });
		if (set.after_false_claim === 'hand_ends') bad.push({ key: 'after_false_claim', value: set.after_false_claim, why: 'others_continue is played with play_on after a false claim' });
	}
	if (set.stock_empty === 'others_pay_first' && set.after_first_out !== 'others_continue') bad.push({ key: 'stock_empty', value: set.stock_empty, why: 'others_pay_first needs after_first_out others_continue' });
	return bad;
}

const NONE = Object.freeze({ claimant: null, claims: Object.freeze([]), ended: null, first: null, at: 0, reached: null });

// the state, read only (a view or a toAct never writes into the hand)
export function stateOf(h) {
	return h.s.m.fuora || NONE;
}

function ensure(h) {
	return h.s.m.fuora || (h.s.m.fuora = { claimant: null, claims: [], ended: null, first: null, at: 0, reached: null });
}

// the tricks phase is entered (every round): nobody may claim yet
export function onEnter(h) {
	const st = ensure(h);
	st.claimant = null;
	st.first = null;
}

export function onPlay(h) {
	const st = ensure(h);
	st.claimant = null;
	st.first = null;
	return [];
}

export function afterTrick(h, entry, rec) {
	const st = ensure(h);
	st.claimant = rec.winner;
	// the last window (if this is the last trick of the pack) starts with the taker
	st.first = rec.winner;
	st.at = 0;
	// the first seat to have made the points (the taker first, then the seats in order)
	if (st.reached === null) {
		for (let k = 0; k < h.s.n; k++) {
			const q = (rec.winner + k) % h.s.n;
			if (livePoints(h, q) >= entry.set.target) { st.reached = q; break; }
		}
	}
	return [];
}

// after_first_out others_continue: a first to go out does not end the hand
const continues = (entry) => entry.set.after_first_out === 'others_continue';
const isOut = (h, seat) => h.outSeats().includes(seat);
// somebody is out and the hand is settled by it (a hand that goes on has its first out, but is not finished)
const finished = (h, entry) => h.s.out !== null && !continues(entry);

const setOf = (h) => h.hooks().find((e) => e.module === 'fuora').set;

// the row of false_claim that applies to this many points (book points), or null
export function rowFor(set, points) {
	for (const r of set.false_claim || []) {
		if (typeof r.below === 'number' ? points < r.below : points >= r.from) return r;
	}
	return null;
}

const enough = (h, entry, seat) => livePoints(h, seat) >= entry.set.target;

// claim_when own_turn: the seat to act in the tricks may claim at any of its turns, in the middle of a trick too
const ownTurn = (entry) => entry.set.claim_when === 'own_turn';
function turnSeat(h, entry) {
	const m = h.s.m.tricks;
	if (!ownTurn(entry) || finished(h, entry) || !h.cur || h.cur.module !== 'tricks' || !m || h.s.hands[m.turn].length === 0) return null;
	// one claim a turn: a false claim is followed by a play, which is a new entry of the log
	return stateOf(h).spent === h.s.log.length ? null : m.turn;
}

const dealOn = (entry) => entry.set.at_round_end !== 'must_claim';

// the seat the last window asks now and its place in the round of asking (seats that went out are not asked)
function windowAt(h, st) {
	const n = h.s.n;
	for (let i = st.at; i < n; i++) {
		const q = (st.first + i) % n;
		if (!isOut(h, q)) return { seat: q, at: i };
	}
	return null;
}

// the last window: the pack is spent, the last trick is taken, and nobody has gone out yet (or, with others_continue,
// not the second)
function windowOf(h, entry) {
	const st = stateOf(h);
	if (!dealOn(entry) || st.first === null || finished(h, entry) || h.s.over || !h.cur || h.cur.module !== 'tricks') return null;
	if (h.s.trick.length !== 0 || !h.s.hands.every((l) => l.length === 0) || h.s.rest.length >= h.dealNeed()) return null;
	return windowAt(h, st);
}

function lastWindow(h, entry) {
	const w = windowOf(h, entry);
	return w ? w.seat : null;
}

export function extraToAct(h, entry) {
	const w = lastWindow(h, entry);
	if (w !== null) return [w];
	const c = stateOf(h).claimant;
	const out = c !== null && !finished(h, entry) && !isOut(h, c) && h.cur.module === 'tricks' ? [c] : [];
	const t = turnSeat(h, entry);
	if (t !== null && !out.includes(t)) out.push(t);
	return out;
}

export function extraLegal(h, entry, seat) {
	const st = stateOf(h);
	const w = lastWindow(h, entry);
	// pass_fuora stands first: a player who has nothing to say takes the first action
	if (w !== null) return w === seat ? [{ type: 'pass_fuora' }, { type: 'claim_fuora' }] : [];
	if (turnSeat(h, entry) === seat) return [{ type: 'claim_fuora' }];
	if (finished(h, entry) || isOut(h, seat) || st.claimant !== seat || h.s.trick.length !== 0) return [];
	// after the last trick of a round only a right claim is offered; it is the only thing left to do
	if (h.s.hands.every((l) => l.length === 0) && !enough(h, entry, seat)) return [];
	return [{ type: 'claim_fuora' }];
}

// the round is over and the taker of its last trick can go out: the engine waits for him
export function hold(h, entry) {
	if (dealOn(entry)) return lastWindow(h, entry) !== null;
	const st = stateOf(h);
	return st.claimant !== null && !finished(h, entry) && h.s.trick.length === 0 && h.s.hands.every((l) => l.length === 0) && enough(h, entry, st.claimant);
}

// the seat at `at` has chosen: the next seat of the last window, or null when all have; the host's own turn marker follows it
// (the tricks phase names its turn to act, hands empty or not)
function nextInWindow(h, st, at) {
	st.at = at + 1;
	const w = windowAt(h, st);
	if (w) h.s.m.tricks.turn = w.seat;
	return w;
}

// the last window is over: nobody went out; the pack has run out (or, by first_reached, the first to reach wins)
function windowEnds(h, entry, events) {
	const s = h.s;
	const st = ensure(h);
	if (entry.set.winner_is === 'first_reached' && st.reached !== null) {
		s.out = { seat: st.reached, points: livePoints(h, st.reached) };
		events.push({ e: 'fuora_first', seat: st.reached, points: s.out.points });
	} else {
		s.stockEmpty = true;
		events.push({ e: 'stock_empty' });
	}
	return { events, endHand: true };
}

export function applyExtra(h, entry, seat, action) {
	const s = h.s;
	const st = ensure(h);
	const wnd = windowOf(h, entry);
	const windowOpen = !!wnd && wnd.seat === seat;
	if (action && action.type === 'pass_fuora') {
		const events = [{ e: 'fuora_passed', seat }];
		return nextInWindow(h, st, wnd.at) ? { events } : windowEnds(h, entry, events);
	}
	const points = livePoints(h, seat);
	const valid = points >= entry.set.target;
	st.claimant = null;
	st.spent = s.log.length;
	const ev = { e: 'fuora_claimed', seat, valid, points };
	if (valid && continues(entry)) return goesOut(h, entry, seat, points, ev, windowOpen ? wnd : null);
	if (valid) {
		// first_reached: the claim is right, the game goes to the seat that made the points before
		const winner = entry.set.winner_is === 'first_reached' && st.reached !== null ? st.reached : seat;
		if (winner !== seat) ev.winner = winner;
		s.out = { seat: winner, points: winner === seat ? points : livePoints(h, winner) };
		st.claims.push({ seat, valid: true, points });
		return { events: [ev], endHand: true };
	}
	if (entry.set.after_false_claim === 'hand_ends') {
		// the claimer loses the hand: the row is what the lost game costs him, paid to each other seat
		const lost = rowFor(entry.set, points);
		st.claims.push({ seat, valid: false, points, stake: lost ? lost.pays.stake : null, ends: true });
		st.ended = { reason: 'false_claim', seat };
		return { events: [ev], endHand: true };
	}
	const row = rowFor(entry.set, points);
	st.claims.push({ seat, valid: false, points, stake: row ? row.pays.stake : null });
	if (windowOpen) {
		// a false claim in the last window is paid; the seat has chosen, the next one is asked
		if (!nextInWindow(h, st, wnd.at)) return windowEnds(h, entry, [ev]);
	}
	return { events: [ev] };
}

// others_continue: a right claim. The first to go out lays his cards face down (they lie in his discard, which no view
// shows) and wins; the hand goes on without him. The second to go out ends the hand.
function goesOut(h, entry, seat, points, ev, wnd) {
	const s = h.s;
	const st = ensure(h);
	const m = s.m.tricks;
	const outs = s.outs || (s.outs = []);
	outs.push({ seat, points });
	if (outs.length === 1) s.out = { seat, points };
	st.claims.push({ seat, valid: true, points });
	st.spent = -1;
	ev.order = outs.length;
	if (outs.length >= 2) return { events: [ev], endHand: true };
	s.discard[seat].push(...s.hands[seat]);
	s.hands[seat] = [];
	const events = [ev];
	if (wnd) {
		// in the last window the others are still asked; when none is left the pack has run out with no second
		return nextInWindow(h, st, wnd.at) ? { events } : windowEnds(h, entry, events);
	}
	// he was to act: the next that plays follows; a trick that is then complete is counted at once
	if (m.turn === seat) m.turn = h.nextPlaying(seat);
	if (s.trick.length === 0) m.leader = m.turn;
	else if (s.trick.length >= h.playing().length) events.push(...finishTrick(h));
	return { events, done: s.trick.length === 0 && h.playingEmpty() };
}

// the game points a false claim gives each other seat (a vada doppio is two, a simple row one)
export function falseClaimPoints(stake) {
	return stake === 'marcia' || stake === 'double' ? 2 : 1;
}

export function viewOf(h, entry, seat) {
	const st = stateOf(h);
	const v = {
		target: entry.set.target,
		canClaim: h.extras(seat).some((x) => x.a.type === 'claim_fuora'),
		lastWindow: lastWindow(h, entry) !== null,
		claims: st.claims.map((c) => ({ seat: c.seat, valid: c.valid, points: c.points })),
	};
	// the seats that are out while the others play on, in the order they went out (only where the hand goes on)
	if (continues(entry)) v.out = (h.s.outs || []).map((o) => ({ seat: o.seat, points: o.points }));
	return v;
}
