// Payments of the hand made by events: the declarations (paid when declared) first, then each row of settle.payments
// whose event happened in the hand. Pure: reads the hand, changes nothing.
import { amountOf } from './settle.js';
import { madeOf, paidOf } from './declarations.js';
import { isObj } from '../util.js';

const ON_PREFIXES = ['last_trick_won_with:', 'lost_in_last_trick:', 'lost_before_last_trick:', 'declaration:'];
const SIDES = ['each_other', 'event_seat', 'losers', 'each_loser', 'winners', 'each_winner'];

// support check of settle.payments (the settle module gives it to its `payments` key)
export function paymentsSupport(v, ctx) {
	if (!Array.isArray(v)) return 'must be a list';
	const ids = new Set();
	for (const p of v) {
		if (!isObj(p) || typeof p.id !== 'string' || ids.has(p.id)) return 'a payment needs a unique id';
		ids.add(p.id);
		if (typeof p.on !== 'string' || !ON_PREFIXES.some((x) => p.on.startsWith(x) && p.on.length > x.length)) return 'payment ' + p.id + ': this event is not played (' + ON_PREFIXES.join(' ') + ')';
		if (!SIDES.includes(p.from) || !SIDES.includes(p.to)) return 'payment ' + p.id + ': from and to are one of ' + SIDES.join(', ');
		if (typeof p.amount !== 'number' && !isObj(p.amount)) return 'payment ' + p.id + ': bad amount';
		if (p.on.startsWith('declaration:') && ctx && ctx.phases && !ctx.phases.some((ph) => ph.module === 'declarations')) return 'payment ' + p.id + ': a declaration payment needs a declarations phase';
	}
	return true;
}

// the seats an event of the row happened to
function eventSeats(h, on) {
	const cut = on.indexOf(':') + 1;
	const kind = on.slice(0, cut);
	const arg = on.slice(cut);
	const out = [];
	if (kind === 'declaration:') {
		for (const d of madeOf(h)) if (d.kind === arg) out.push(d.seat);
		return out;
	}
	const tricks = h.s.tricks;
	tricks.forEach((t, i) => {
		const play = t.cards.find((c) => c.card === arg);
		if (!play) return;
		const last = i === tricks.length - 1;
		const won = t.winner === play.seat;
		if (kind === 'last_trick_won_with:' && last && won) out.push(play.seat);
		else if (kind === 'lost_in_last_trick:' && last && !won) out.push(play.seat);
		else if (kind === 'lost_before_last_trick:' && !last && !won && t.fool !== play.seat) out.push(play.seat);
	});
	return out;
}

function members(h, which, eventSeat) {
	const all = Array.from({ length: h.s.n }, (_, i) => i);
	const w = (h.s.result && h.s.result.winners) || [];
	if (which === 'event_seat') return [eventSeat];
	if (which === 'each_other') return all.filter((q) => q !== eventSeat);
	if (which === 'winners' || which === 'each_winner') return all.filter((q) => w.includes(q));
	return all.filter((q) => !w.includes(q));
}

export function handPayments(h, set) {
	const out = paidOf(h);
	for (const row of (set && set.payments) || []) {
		const amount = amountOf(row.amount, h.game.options);
		if (!amount) continue;
		for (const seat of eventSeats(h, row.on)) {
			for (const from of members(h, row.from, seat)) {
				for (const to of members(h, row.to, seat)) if (from !== to) out.push({ from, to, amount, why: row.id });
			}
		}
	}
	return out;
}
