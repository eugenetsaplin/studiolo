// bidding: the auction for the contract. The order of speech is the order of priority. A seat earlier in it may MATCH
// the standing bid of a later seat; a later seat must bid HIGHER (tie: challenger lets a seat match the bid of the dealer,
// once: the dealer then has only a higher bid or a pass; dealer lets the dealer match). A pass is final. The auction ends when every seat but the last bidder has passed. When all pass:
// a throw-in or a fallback contract (all_pass). State: s.m[phase id].
import { seatAt } from '../util.js';

export const name = 'bidding';
export const version = '1.0.0';

const contractIds = (ctx) => (ctx.rules.contracts || []).map((c) => c.id);

export const supports = {
	contracts: (v, ctx) => (Array.isArray(v) && v.length > 0 && v.every((x) => contractIds(ctx).includes(x))) || 'must list contracts the file defines',
	opens: ['dealer_right', 'dealer', 'non_dealer'],
	dealer_speaks: ['in_turn', 'last', 'first'],
	tie: ['earlier_seat', 'challenger', 'dealer'],
	pass_is_final: [true],
	all_pass: (v, ctx) => {
		if (v === 'redeal' || v === 'redeal_next_dealer') return true;
		if (typeof v === 'string' && v.startsWith('contract:') && contractIds(ctx).includes(v.slice(9))) return true;
		return 'redeal, redeal_next_dealer or contract:<id> of a contract the file defines';
	},
	bid_binds: [true],
	lay_down_fewer: ['plays_at_laid'],
	after_dealer_pass: ['call', 'others_bid'],
};

export function check(set, ctx) {
	const bad = [];
	const fb = typeof set.all_pass === 'string' && set.all_pass.startsWith('contract:');
	if (set.after_dealer_pass === 'call' && set.dealer_speaks !== 'first') bad.push({ key: 'after_dealer_pass', value: 'call', why: 'the dealer calls after his pass only when he speaks first' });
	if (set.after_dealer_pass === 'call' && !fb) bad.push({ key: 'after_dealer_pass', value: 'call', why: 'the dealer needs a fallback contract (all_pass: contract:<id>)' });
	return bad;
}

// the contract of the game file by id: {id, rank, exchange, onoranza, sides}
export function contractOf(h, id) {
	return h.contractById(id);
}

const st = (h, entry) => h.s.m[entry.id];

// the seats in the order of speech
export function speechOrder(h, set) {
	const s = h.s;
	const first = set.opens === 'dealer' ? s.dealer : seatAt(s.dealer, 1, s.n);
	const order = Array.from({ length: s.n }, (_, i) => seatAt(first, i, s.n));
	const speaks = set.dealer_speaks || 'in_turn';
	if (speaks === 'in_turn') return order;
	const rest = order.filter((q) => q !== s.dealer);
	return speaks === 'first' ? [s.dealer, ...rest] : [...rest, s.dealer];
}

export function enter(h) {
	const set = h.cur.set;
	const order = speechOrder(h, set);
	h.s.m[h.cur.id] = { order, passed: [], bids: [], best: null, at: order[0], done: false };
	return { events: [], done: false };
}

export function toAct(h) {
	const m = h.s.m[h.cur.id];
	return m && !m.done ? [m.at] : [];
}

const rankOf = (h, id) => contractOf(h, id).rank;

// the contracts this seat may bid now
function bidsOf(h, entry, seat) {
	const m = st(h, entry);
	const set = entry.set;
	const out = [];
	for (const id of set.contracts) {
		if (m.best) {
			const r = rankOf(h, id);
			const b = rankOf(h, m.best.contract);
			if (r < b) continue;
			if (r === b) {
				const tie = set.tie || 'earlier_seat';
				let ok;
				if (tie === 'challenger') ok = m.best.seat === h.s.dealer && seat !== h.s.dealer;
				else if (tie === 'dealer') ok = seat === h.s.dealer;
				else ok = m.order.indexOf(seat) < m.order.indexOf(m.best.seat);
				if (!ok) continue;
			}
		}
		out.push(id);
	}
	return out;
}

export function legal(h, seat) {
	const m = h.s.m[h.cur.id];
	if (!m || m.done || m.at !== seat) return [];
	return [...bidsOf(h, h.cur, seat).map((id) => ({ type: 'bid_' + id })), { type: 'pass' }];
}

export function apply(h, seat, action) {
	const s = h.s;
	const entry = h.cur;
	const set = entry.set;
	const m = st(h, entry);
	const events = [];
	if (action.type === 'pass') {
		m.passed.push(seat);
		m.bids.push({ seat, bid: 'pass' });
		events.push({ e: 'bid', seat, bid: 'pass' });
	} else {
		const id = action.type.slice(4);
		m.best = { seat, contract: id };
		m.bids.push({ seat, bid: id });
		events.push({ e: 'bid', seat, bid: id });
	}
	const open = m.order.filter((q) => !m.passed.includes(q));
	const fallback = typeof set.all_pass === 'string' && set.all_pass.startsWith('contract:') ? set.all_pass.slice(9) : null;
	const dealerCalls = set.after_dealer_pass === 'call' && !m.best && action.type === 'pass' && seat === s.dealer && m.order[0] === s.dealer;
	if (dealerCalls || open.length === 0) {
		m.done = true;
		s.allPassed = true;
		events.push({ e: 'all_passed' });
		if (fallback) {
			h.setContract(fallback, s.dealer);
			events.push({ e: 'contract_won', contract: fallback, declarer: s.dealer });
			return { events, done: true };
		}
		events.push(...h.throwIn('all_passed'));
		return { events, done: false };
	}
	if (m.best && open.length === 1 && open[0] === m.best.seat) {
		m.done = true;
		h.setContract(m.best.contract, m.best.seat);
		events.push({ e: 'contract_won', contract: m.best.contract, declarer: m.best.seat });
		return { events, done: true };
	}
	// the next seat still in the auction, after this one in the order of speech
	const at = m.order.indexOf(seat);
	for (let i = 1; i <= m.order.length; i++) {
		const q = m.order[(at + i) % m.order.length];
		if (!m.passed.includes(q) && !(m.best && q === m.best.seat && open.length > 1)) { m.at = q; break; }
	}
	return { events, done: false };
}

// view.bidding: the auction so far, the standing bid and whether it is over
export function viewPart(h, entry) {
	const m = st(h, entry);
	if (!m) return { bidding: null };
	return { bidding: { order: m.order.slice(), bids: m.bids.map((b) => ({ ...b })), best: m.best ? { ...m.best } : null, done: m.done } };
}
