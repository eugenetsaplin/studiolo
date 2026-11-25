// exchange: the called exchange. The declarer lays cards down face down, one action each (lay_down {card}; the honours
// may not be laid unless an exception allows, like the discard), then calls as many cards by name (call {card}). The
// holders of the called cards give them and take the laid cards unseen, the laid cards chosen by the seed of the deal
// (give random). A called card that lies in the dealer's discard goes to the declarer; the dealer's discard takes a laid
// card in its place (card_not_held from_discard). The declarer may stop laying early (lay_done, at least one card)
// when the bid allows it: the contract then becomes the one whose exchange equals the cards laid.
// State, by phase id: s.m.<id> = {stage, need, laid, called, gave, got}. Plain JSON.
import { ALL, sortCards } from '../cards.js';
import { makeRng, shuffle } from '../rng.js';
import { compileSelector, conditionUnsupported } from '../selectors.js';
import { isObj } from '../util.js';

export const name = 'exchange';
export const version = '1.0.0';
export const viewKey = 'exchange';

const selectorOk = (sel, env) => { try { compileSelector(sel, env); return true; } catch { return false; } };

export const supports = {
	count: (v) => v === 'contract' || (Number.isInteger(v) && v >= 0) || 'bad count',
	lay_down_first: [true],
	face: ['down'],
	callable: (v, ctx) => (Array.isArray(v) && v.every((x) => selectorOk(x, ctx.env))) || 'bad selector',
	card_not_held: ['from_discard'],
	give: ['random'],
	discard_honours_barred: [true, false],
	barred: (v, ctx) => (Array.isArray(v) && v.every((x) => selectorOk(x, ctx.env))) || 'bad selector',
	allowed_exceptions: (v, ctx) => {
		if (!Array.isArray(v)) return 'must be a list';
		for (const e of v) {
			if (!isObj(e) || !selectorOk(e, ctx.env)) return 'bad selector';
			if (e.if && conditionUnsupported(e.if).length) return 'the condition ' + conditionUnsupported(e.if).join(', ') + ' is not played';
		}
		return true;
	},
};

// the deal must leave no undealt cards (a legal call would otherwise show where the rest is); a bidding phase must come first
export function check(set, ctx) {
	const bad = [];
	const deal = ctx.phases.find((p) => p.module === 'deal');
	const dead = deal && deal.settings && deal.settings.dead ? deal.settings.dead.value : 'out';
	if (deal && dead !== 'none') bad.push({ key: 'callable', value: set.callable, why: 'the exchange needs deal.dead none (every card is in a hand or a discard)' });
	const at = ctx.phases.indexOf(ctx.phase);
	if (!ctx.phases.slice(0, at < 0 ? undefined : at).some((p) => p.module === 'bidding')) bad.push({ key: 'count', value: set.count, why: 'the exchange needs a bidding phase before it' });
	return bad;
}

const stateOf = (h, entry) => h.s.m[entry.id];

export function contractsOf(h) { return h.game.rules.contracts || []; }
export function contractById(h, id) { return contractsOf(h).find((c) => c.id === id) || null; }

function needOf(h, set) {
	if (Number.isInteger(set.count)) return set.count;
	const c = contractById(h, h.s.contract);
	return c ? c.exchange || 0 : 0;
}

export function enter(h) {
	const s = h.s;
	const e = h.cur;
	const need = needOf(h, e.set);
	s.m[e.id] = { stage: need > 0 ? 'lay' : 'done', need, laid: [], called: [], gave: {}, got: {} };
	return { events: [], done: need === 0 };
}

export function toAct(h) {
	const m = h.s.m[h.cur.id];
	return m && m.stage !== 'done' && Number.isInteger(h.s.declarer) ? [h.s.declarer] : [];
}

// the honours of the discard rule, less the exceptions; judged on the hand as dealt to this phase (laid cards count as held)
function barredPredicate(h, set) {
	const env = h.game.env;
	const cfg = h.game.cfg;
	const parts = [];
	if (set.discard_honours_barred === true) {
		if (cfg.cards.sets && cfg.cards.sets.honours) parts.push(compileSelector('set:honours', env));
		else { const v = h.game.tables.values.v; parts.push((c) => v[c] >= 5); }
	}
	for (const b of set.barred || []) parts.push(compileSelector(b, env));
	const exc = (set.allowed_exceptions || []).map((x) => compileSelector(x, env));
	return (c, scope) => parts.some((p) => p(c, scope)) && !exc.some((p) => p(c, scope));
}

// may the declarer stop laying early? Only when the bid is played as it was laid
function mayStopEarly(h) {
	const b = h.entry('bidding');
	return !!b && (b.set.lay_down_fewer === undefined || b.set.lay_down_fewer === 'plays_at_laid');
}

// the cards the declarer may call: not in his hand, his discard, laid or called already; any other card, wherever it lies
export function callableCards(h, entry, seat) {
	const s = h.s;
	const m = stateOf(h, entry);
	const sel = (entry.set.callable || ['all']).map((x) => compileSelector(x, h.game.env));
	const own = new Set([...s.hands[seat], ...s.discard[seat], ...m.laid, ...m.called]);
	return ALL.filter((c) => !own.has(c) && sel.some((p) => p(c, null)));
}

export function legal(h, seat) {
	const s = h.s;
	const e = h.cur;
	const m = s.m[e.id];
	if (!m || seat !== s.declarer) return [];
	if (m.stage === 'lay') {
		const hand = s.hands[seat];
		const bar = barredPredicate(h, e.set);
		const scope = { hand: hand.concat(m.laid) };
		let ok = hand.filter((c) => !bar(c, scope));
		if (!ok.length) ok = hand;
		const out = ok.map((card) => ({ type: 'lay_down', card }));
		if (m.laid.length >= 1 && m.laid.length < m.need && mayStopEarly(h)) out.push({ type: 'lay_done' });
		return out;
	}
	if (m.stage === 'call') return callableCards(h, e, seat).map((card) => ({ type: 'call', card }));
	return [];
}

// the laid cards go to the holders, unseen: one laid card for each called card, drawn by the seed
function doExchange(h, seat) {
	const s = h.s;
	const e = h.cur;
	const m = s.m[e.id];
	const gifts = shuffle(m.laid.slice(), makeRng(`${s.seed}:${e.id}:give`));
	const dealer = s.dealer;
	m.called.forEach((card, i) => {
		const gift = gifts[i];
		let holder = -1;
		for (let q = 0; q < s.n; q++) if (q !== seat && s.hands[q].includes(card)) holder = q;
		if (holder >= 0) {
			s.hands[holder].splice(s.hands[holder].indexOf(card), 1);
			s.hands[holder].push(gift);
		} else {
			holder = dealer; // the card lay in a discard (the dealer's): a laid card takes its place there
			for (let q = 0; q < s.n; q++) if (s.discard[q] && s.discard[q].includes(card)) holder = q;
			const at = s.discard[holder].indexOf(card);
			s.discard[holder][at] = gift;
		}
		(m.gave[holder] = m.gave[holder] || []).push(card);
		(m.got[holder] = m.got[holder] || []).push(gift);
		s.hands[seat].push(card);
	});
	for (const q of Array.from({ length: s.n }, (_, i) => i)) sortCards(s.hands[q]);
	m.stage = 'done';
}

export function apply(h, seat, action) {
	const s = h.s;
	const e = h.cur;
	const m = s.m[e.id];
	const events = [];
	if (action.type === 'lay_down') {
		s.hands[seat].splice(s.hands[seat].indexOf(action.card), 1);
		m.laid.push(action.card);
		if (m.laid.length === m.need) { m.stage = 'call'; events.push({ e: 'laid', seat, n: m.need, contract: s.contract }); }
		return { events, done: false };
	}
	if (action.type === 'lay_done') {
		m.need = m.laid.length;
		const c = contractsOf(h).find((x) => x.exchange === m.need && x.sides === (contractById(h, s.contract) || {}).sides);
		if (c) h.setContract(c.id, seat);
		m.stage = 'call';
		events.push({ e: 'laid', seat, n: m.need, contract: s.contract });
		return { events, done: false };
	}
	m.called.push(action.card);
	if (m.called.length < m.need) return { events, done: false };
	events.push({ e: 'called', cards: m.called.slice() });
	doExchange(h, seat);
	events.push({ e: 'exchanged', n: m.need });
	return { events, done: true };
}

// view.exchange: counts and called names for all; the laid cards and the card received for the declarer; what a holder gave and got
export function viewOf(h, entry, seat) {
	const m = stateOf(h, entry);
	if (!m) return null;
	const mine = { laid: [], gave: [], got: [] };
	if (seat === h.s.declarer) {
		mine.laid = m.laid.slice();
		if (m.stage === 'done') mine.got = m.called.slice();
	} else if (m.stage === 'done') {
		mine.gave = (m.gave[seat] || []).slice();
		mine.got = (m.got[seat] || []).slice();
	}
	return { laid: m.laid.length, called: m.called.slice(), mine };
}

// view.contract: how many cards are laid, and the called names
export function contractView(h, entry) {
	const m = stateOf(h, entry);
	return m ? { laid: m.laid.length, called: m.called.slice() } : null;
}

export function viewPart(h, entry, seat) {
	return { exchange: viewOf(h, entry, seat) };
}
