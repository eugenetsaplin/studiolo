// fuora (a hook of tricks): going out of a game of repeated deals. The seat that has taken a trick may say «fuora» before
// anything else happens (claim_when after_trick); the engine counts its points aloud. Enough points: it is out and
// the hand ends. Too few: it pays the false_claim row and play goes on (after_false_claim play_on) or the hand ends
// and the claimer loses it (hand_ends). The claim window also stands after the last trick of a round, before the next
// deal, but only for a seat that can claim rightly (a false claim there could only cost it).
import { livePoints } from './count.js';

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
	after_first_out: ['hand_ends'],
	stock_empty: ['hand_ends_no_winner'],
};

export function check(set, ctx) {
	const bad = [];
	if (!ctx.phase || ctx.phase.during !== 'tricks') bad.push({ key: 'target', value: set.target, why: 'fuora is a hook of tricks (during: tricks)' });
	if (set.target === undefined) bad.push({ key: 'target', value: null, why: 'target is required' });
	return bad;
}

const NONE = Object.freeze({ claimant: null, claims: Object.freeze([]), ended: null });

// the state, read only (a view or a toAct never writes into the hand)
export function stateOf(h) {
	return h.s.m.fuora || NONE;
}

function ensure(h) {
	return h.s.m.fuora || (h.s.m.fuora = { claimant: null, claims: [], ended: null });
}

// the tricks phase is entered (every round): nobody may claim yet
export function onEnter(h) {
	ensure(h).claimant = null;
}

export function onPlay(h) {
	ensure(h).claimant = null;
	return [];
}

export function afterTrick(h, entry, rec) {
	ensure(h).claimant = rec.winner;
	return [];
}

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
	if (!ownTurn(entry) || h.s.out !== null || !h.cur || h.cur.module !== 'tricks' || !m || h.s.hands[m.turn].length === 0) return null;
	// one claim a turn: a false claim is followed by a play, which is a new entry of the log
	return stateOf(h).spent === h.s.log.length ? null : m.turn;
}

export function extraToAct(h, entry) {
	const c = stateOf(h).claimant;
	const out = c !== null && h.s.out === null && h.cur.module === 'tricks' ? [c] : [];
	const t = turnSeat(h, entry);
	if (t !== null && !out.includes(t)) out.push(t);
	return out;
}

export function extraLegal(h, entry, seat) {
	const st = stateOf(h);
	if (turnSeat(h, entry) === seat) return [{ type: 'claim_fuora' }];
	if (h.s.out !== null || st.claimant !== seat || h.s.trick.length !== 0) return [];
	// after the last trick of a round only a right claim is offered; it is the only thing left to do
	if (h.s.hands.every((l) => l.length === 0) && !enough(h, entry, seat)) return [];
	return [{ type: 'claim_fuora' }];
}

// the round is over and the taker of its last trick can go out: the engine waits for him
export function hold(h, entry) {
	const st = stateOf(h);
	return st.claimant !== null && h.s.out === null && h.s.trick.length === 0 && h.s.hands.every((l) => l.length === 0) && enough(h, entry, st.claimant);
}

export function applyExtra(h, entry, seat) {
	const s = h.s;
	const st = ensure(h);
	const points = livePoints(h, seat);
	const valid = points >= entry.set.target;
	st.claimant = null;
	st.spent = s.log.length;
	const ev = { e: 'fuora_claimed', seat, valid, points };
	if (valid) {
		s.out = { seat, points };
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
	return { events: [ev] };
}

// the game points a false claim gives each other seat (a vada doppio is two, a simple row one)
export function falseClaimPoints(stake) {
	return stake === 'marcia' || stake === 'double' ? 2 : 1;
}

export function viewOf(h, entry, seat) {
	const st = stateOf(h);
	return {
		target: entry.set.target,
		canClaim: h.extras(seat).some((x) => x.a.type === 'claim_fuora'),
		claims: st.claims.map((c) => ({ seat: c.seat, valid: c.valid, points: c.points })),
	};
}
