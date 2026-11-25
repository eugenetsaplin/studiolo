// call_partner: the caller names a card by its rank (the ladder: kings first; a rank below only when the caller holds
// all four cards of the rank above, in his hand or his discard). The holder of the called card is the caller's partner,
// secret until that card is played (s.secret = {card, holder}). The caller may call a card he holds himself: he then
// plays alone against the rest and nobody knows it until the card is played (own_card). A card of his own discard is
// never called (card_in_discard forbidden). With every card of the ladder in his hand or discard he plays alone at the
// contract without exchange and without a partner. State, by phase id: s.m.<id> = {caller, stage, card, holder, revealed}.
import { ALL, INFO } from '../cards.js';

export const name = 'call_partner';
export const version = '1.0.0';
export const viewKey = 'call';

const RANKS = ['K', 'Q', 'N', 'J'];

export const supports = {
	caller: ['dealer', 'declarer'],
	ladder: (v) => (Array.isArray(v) && v.length > 0 && v.every((r) => RANKS.includes(r))) || 'a list of the ranks K, Q, N, J',
	step_down: ['caller_holds_all_of_rank'],
	secret: [true, false],
	own_card: ['plays_alone_unless_forgiven', 'plays_alone', 'forbidden'],
	card_in_discard: ['forbidden'],
};

export function check(set, ctx) {
	const bad = [];
	const at = ctx.phases.indexOf(ctx.phase);
	if (!ctx.phases.slice(0, at < 0 ? undefined : at).some((p) => p.module === 'bidding')) bad.push({ key: 'caller', value: set.caller, why: 'calling a partner needs a bidding phase before it' });
	return bad;
}

const stateOf = (h, entry) => h.s.m[entry.id];
const contracts = (h) => h.game.rules.contracts || [];

function callerOf(h, set) {
	return set.caller === 'declarer' && Number.isInteger(h.s.declarer) ? h.s.declarer : h.s.dealer;
}

// the cards the caller may name: the first rank of the ladder he does not hold whole (hand and discard together),
// less his own discard, less his own cards when own_card is forbidden
export function callableCards(h, entry, seat) {
	const s = h.s;
	const set = entry.set;
	// completeness of a rank is judged on the hand as it stands, after the discard: a king put away does not make the
	// kings whole, and four kings held after the discard send the caller to the queens
	const known = new Set(s.hands[seat]);
	for (const r of set.ladder || ['K']) {
		const cards = ALL.filter((c) => !INFO[c].trump && INFO[c].rank === r);
		if (cards.every((c) => known.has(c))) continue;
		return cards.filter((c) => !s.discard[seat].includes(c) && !(set.own_card === 'forbidden' && s.hands[seat].includes(c)));
	}
	return [];
}

// the contract a caller falls back to when nothing of the ladder can be called: no exchange, no partner, one against the rest
function aloneContract(h) {
	const list = contracts(h).filter((c) => c.exchange === 0 && c.sides === 'declarer_vs_rest');
	return list.length ? list.reduce((a, c) => ((c.rank || 0) > (a.rank || 0) ? c : a)) : null;
}

export function enter(h) {
	const s = h.s;
	const e = h.cur;
	const caller = callerOf(h, e.set);
	const m = { caller, stage: 'call', card: null, holder: null, revealed: false };
	s.m[e.id] = m;
	if (!callableCards(h, e, caller).length) {
		m.stage = 'done';
		const c = aloneContract(h);
		if (c) h.setContract(c.id, Number.isInteger(s.declarer) ? s.declarer : caller);
		return { events: [{ e: 'no_call', seat: caller, contract: s.contract }], done: true };
	}
	return { events: [], done: false };
}

export function toAct(h) {
	const m = h.s.m[h.cur.id];
	return m && m.stage === 'call' ? [m.caller] : [];
}

export function legal(h, seat) {
	const m = h.s.m[h.cur.id];
	if (!m || m.stage !== 'call' || seat !== m.caller) return [];
	return callableCards(h, h.cur, seat).map((card) => ({ type: 'call_partner', card }));
}

export function apply(h, seat, action) {
	const s = h.s;
	const e = h.cur;
	const m = s.m[e.id];
	let holder = seat;
	for (let q = 0; q < s.n; q++) if (s.hands[q].includes(action.card)) holder = q;
	m.card = action.card;
	m.holder = holder;
	m.stage = 'done';
	h.setPartner(holder);
	const events = [{ e: 'partner_called', card: action.card }];
	if (e.set.secret === false) { m.revealed = true; events.push({ e: 'partner_revealed', seat: holder }); } else s.secret = { card: action.card, holder };
	return { events, done: true };
}

// the engine calls this after every card played in the tricks: the called card shows who the partner is
export function onCardPlayed(h, entry, seat, card) {
	const s = h.s;
	if (!s.secret || s.secret.card !== card) return [];
	const m = stateOf(h, entry);
	if (m) m.revealed = true;
	const holder = s.secret.holder;
	s.secret = null;
	return [{ e: 'partner_revealed', seat: holder }];
}

// view.call: the called card for all; the partner for the partner himself, the caller who called his own card, and all once revealed
export function viewOf(h, entry, seat) {
	const m = stateOf(h, entry);
	if (!m || m.card === null) return null;
	const knows = m.revealed || seat === m.holder;
	return { card: m.card, revealed: m.revealed, partner: knows ? m.holder : null };
}


// view.contract: the called card is public
export function contractView(h, entry) {
	const m = stateOf(h, entry);
	return m && m.card !== null ? { called: [m.card] } : null;
}

export function viewPart(h, entry, seat) {
	return { call: viewOf(h, entry, seat) };
}
