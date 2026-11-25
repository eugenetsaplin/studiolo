// tricks: the play. Follow the led suit, else a trump when must_trump; the Fool (excuse) is playable on any trick,
// takes nothing and is never taken: its owner takes it back. Engine defaults: when the Fool leads, the next card
// played sets the led suit and the Fool's owner never wins that trick.
import { INFO, FOOL } from '../cards.js';
import { seatAt } from '../util.js';

export const name = 'tricks';
export const version = '1.0.0';

export function check(set, ctx) {
	const bad = [];
	if (set.play_from === 'pile_tops' && !ctx.phases.some((p) => p.module === 'open_piles')) bad.push({ key: 'play_from', value: 'pile_tops', why: 'pile_tops needs an open_piles phase' });
	return bad;
}

export const supports = {
	first_leader: ['non_dealer', 'dealer_right', 'previous_last_taker', 'round_last_taker'],
	next_leader: ['trick_winner'],
	follow_suit: [true, false],
	must_trump: [true, false],
	must_overtrump: [true, false],
	play_from: ['hand', 'pile_tops'],
	fool_may_lead: [true, false],
};

// the Fool is an excuse (the default) or an ordinary trionfo of the order (cards.fool: trump)
const excuseOf = (h, c) => c === FOOL && h.game.cfg.cards.fool !== 'trump';
const cat = (c) => (INFO[c].trump ? 'trump' : INFO[c].suit);

export function enter(h) {
	const s = h.s;
	const set = h.cur.set;
	let leader = seatAt(s.dealer, 1, s.n);
	if (set.first_leader === 'previous_last_taker' && s.carry && Number.isInteger(s.carry.lastTaker)) leader = s.carry.lastTaker;
	// round_last_taker: a first round starts on the dealer's right; a later round of the same game, the taker of the last trick
	if (set.first_leader === 'round_last_taker' && s.round > 0 && s.tricks.length) leader = s.tricks[s.tricks.length - 1].winner;
	if (set.first_leader === 'previous_last_taker' && s.round > 0 && s.tricks.length) leader = s.tricks[s.tricks.length - 1].winner;
	s.m.tricks = { turn: leader, led: null, leader };
	s.trick = [];
	for (const hook of h.game.hooks.tricks || []) if (hook.mod && hook.mod.onEnter) hook.mod.onEnter(h, hook);
	if (s.hands[0].length === 0) return { events: [], done: true };
	return { events: [], done: false };
}

export function toAct(h) {
	const m = h.s.m.tricks;
	return m ? [m.turn] : [];
}

function strengthOf(h, c) {
	return INFO[c].trump ? h.game.tables.trumpStrength[c] || 0 : h.game.tables.suitStrength[c];
}

// the cards a seat chooses from: its hand, or what a hook shows (the open tops of piles)
function playableOf(h, seat) {
	for (const hook of h.game.hooks.tricks || []) {
		if (hook.mod && hook.mod.playable) { const r = hook.mod.playable(h, hook, seat); if (r) return r; }
	}
	return h.s.hands[seat];
}

export function legal(h, seat) {
	const s = h.s;
	const set = h.cur.set;
	const m = s.m.tricks;
	const hand = playableOf(h, seat);
	let cards = hand;
	if (s.trick.length === 0) {
		if (set.fool_may_lead === false && hand.length > 1) cards = hand.filter((c) => !excuseOf(h, c));
	} else if (m.led !== null && set.follow_suit !== false) {
		const led = m.led;
		const same = hand.filter((c) => !excuseOf(h, c) && cat(c) === led);
		let allowed = null;
		if (same.length) allowed = same;
		else if (led === 'trump' || set.must_trump !== false) {
			const trumps = hand.filter((c) => !excuseOf(h, c) && INFO[c].trump);
			if (trumps.length) allowed = trumps;
		}
		if (allowed) {
			if (set.must_overtrump && allowed[0] && INFO[allowed[0]].trump) {
				let top = 0;
				for (const t of s.trick) if (INFO[t.card].trump && !excuseOf(h, t.card)) top = Math.max(top, strengthOf(h, t.card));
				const higher = allowed.filter((c) => strengthOf(h, c) > top);
				if (higher.length) allowed = higher;
			}
			cards = hand.includes(FOOL) && excuseOf(h, FOOL) ? [...allowed, FOOL] : allowed;
		}
	}
	return cards.map((card) => ({ type: 'play', card }));
}

function winnerOf(h, trick, led) {
	let best = null;
	let bestKey = -1;
	for (const t of trick) {
		if (excuseOf(h, t.card)) continue;
		const c = cat(t.card);
		let key;
		if (c === 'trump') key = 1000 + strengthOf(h, t.card);
		else if (c === led) key = strengthOf(h, t.card);
		else continue;
		if (key > bestKey) { bestKey = key; best = t.seat; }
	}
	return best;
}

// Why the winner of a finished trick took it: one code of a closed list (view.tricks[].reason; CORE_API.md section 3, View).
// Read from the trick as winnerOf reads it; never stored in the state (the snapshot and the result stay as they are).
//   high_suit  — the highest card of the suit led; no trump was played
//   high_trump — trumps were led; the highest trump
//   trumped    — a plain suit was led; the winner played the highest trump
//   alone      — every other card of the trick was the Fool as an excuse: the only real card takes it
// The suit led is set by the first card that is not the excuse (when the Fool leads, by the card after it).
export const TRICK_REASONS = ['high_suit', 'high_trump', 'trumped', 'alone'];

export function reasonOf(h, rec) {
	const real = rec.cards.filter((t) => !excuseOf(h, t.card));
	if (real.length === 1) return 'alone';
	const led = cat(real[0].card);
	const win = rec.cards.find((t) => t.seat === rec.winner && !excuseOf(h, t.card));
	if (!win || cat(win.card) !== 'trump') return 'high_suit';
	return led === 'trump' ? 'high_trump' : 'trumped';
}

export function apply(h, seat, action) {
	const s = h.s;
	const m = s.m.tricks;
	const events = [];
	const hand = s.hands[seat];
	hand.splice(hand.indexOf(action.card), 1);
	s.trick.push({ seat, card: action.card });
	events.push({ e: 'card_played', seat, card: action.card });
	for (const hook of h.game.hooks.tricks || []) if (hook.mod && hook.mod.onPlay) events.push(...hook.mod.onPlay(h, hook, seat, action.card));
	// the listeners of the other phases (a called partner shows himself by the called card)
	for (const e of h.game.plan) if (e.mod && e.mod.onCardPlayed && h.runs(e)) events.push(...e.mod.onCardPlayed(h, e, seat, action.card));
	if (m.led === null && !excuseOf(h, action.card)) m.led = cat(action.card);
	if (s.trick.length < s.n) {
		m.turn = seatAt(seat, 1, s.n);
		return { events, done: false };
	}
	// the trick is complete
	const winner = winnerOf(h, s.trick, m.led);
	let foolOwner = null;
	const taken = [];
	for (const t of s.trick) {
		if (excuseOf(h, t.card)) { foolOwner = t.seat; s.won[t.seat].push(t.card); events.push({ e: 'fool_kept', seat: t.seat }); }
		else taken.push(t.card);
	}
	s.won[winner].push(...taken);
	const rec = { leader: m.leader, cards: s.trick.map((t) => ({ seat: t.seat, card: t.card })), winner, fool: foolOwner, prize: null };
	s.tricks.push(rec);
	events.push({ e: 'trick_won', seat: winner, cards: taken.slice() });
	for (const hook of h.game.hooks.tricks || []) {
		if (hook.mod && hook.mod.afterTrick) events.push(...hook.mod.afterTrick(h, hook, rec, s.tricks.length - 1));
	}
	s.trick = [];
	m.led = null;
	m.leader = winner;
	m.turn = winner;
	return { events, done: s.hands[0].length === 0 };
}
