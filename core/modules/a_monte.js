// a_monte: throwing the deal in by unanimous consent. A window opens after each packet round of the deal
// (windows "deal.packet") or after the whole deal (windows "deal"). In a window the seats are asked in turn, from the
// right of the dealer: propose or pass. A proposal goes to the vote of all the others at once: one refusal closes the
// window, all agreeing redeals with the seed + "/a" + count.
import { seatAt } from '../util.js';
import * as deal from './deal.js';

export const name = 'a_monte';
export const version = '1.0.0';

export const supports = {
	consent: ['unanimous'],
	what: ['redeal'],
	windows: (v) => (Array.isArray(v) && v.length > 0 && v.every((w) => w === 'deal' || w === 'deal.packet')) || 'only the windows "deal" and "deal.packet" are played',
};

export function check(set, ctx) {
	const at = ctx.phaseIndex;
	const prev = ctx.phases[at - 1];
	if (!prev || prev.module !== 'deal') return [{ key: 'windows', value: set.windows, why: 'the windows follow the deal phase: a_monte must come right after it' }];
	return [];
}

function openWindow(h) {
	const { n, dealer } = h.s;
	const order = [];
	for (let i = 1; i <= n; i++) order.push(seatAt(dealer, i, n));
	h.s.m.a_monte = { stage: 'ask', order, at: 0, proposer: null, agreed: [], voters: [] };
}

export function enter(h) {
	openWindow(h);
	return { events: [], done: false };
}

export function toAct(h) {
	const m = h.s.m.a_monte;
	if (m.stage === 'ask') return [m.order[m.at]];
	return m.voters.filter((x) => !m.agreed.includes(x));
}

export function legal(h, seat) {
	const m = h.s.m.a_monte;
	if (m.stage === 'ask') return [{ type: 'a_monte_propose' }, { type: 'a_monte_pass' }];
	return [{ type: 'a_monte_agree' }, { type: 'a_monte_refuse' }];
}

// the window is over: deal the next packet round and open the next window, or go on to the next phase
function closeWindow(h, events) {
	if (deal.roundsLeft(h) > 0) {
		events.push(deal.dealRound(h));
		openWindow(h);
		return false;
	}
	deal.finish(h);
	h.s.m.a_monte = null;
	return true;
}

export function apply(h, seat, action) {
	const s = h.s;
	const m = s.m.a_monte;
	const events = [];
	if (action.type === 'a_monte_pass') {
		m.at++;
		if (m.at >= m.order.length) return { events, done: closeWindow(h, events) };
		return { events, done: false };
	}
	if (action.type === 'a_monte_propose') {
		m.stage = 'vote';
		m.proposer = seat;
		m.voters = m.order.filter((x) => x !== seat);
		m.agreed = [];
		return { events, done: false };
	}
	if (action.type === 'a_monte_refuse') {
		events.push({ e: 'a_monte', result: 'refused' });
		return { events, done: closeWindow(h, events) };
	}
	// agree
	m.agreed.push(seat);
	if (m.agreed.length < m.voters.length) return { events, done: false };
	s.aCount = (s.aCount || 0) + 1;
	events.push({ e: 'a_monte', result: 'redeal', count: s.aCount });
	deal.start(h, s.seed + '/a' + s.aCount, null);
	events.push(deal.dealRound(h));
	if (h.aMonteWindows() !== 'packet') {
		while (deal.roundsLeft(h) > 0) events.push(deal.dealRound(h));
		deal.finish(h);
	}
	openWindow(h);
	return { events, done: false };
}
