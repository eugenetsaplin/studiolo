// Playing a world to the end of the hand. Every applied action is counted: the clock of the bot is a count of
// actions, so a decision is the same on every machine.
import { greedyPlay, greedyDiscard, foolGive, extraAction, handPoints, contractAction, isContractLegal } from './policy.js';

// A greedy rollout player slips to a random legal card with this chance: players are not machines, and a pure
// greedy model of the others is wrong too often at three seats.
export const SLIP = 0.3;

// mode: "random" (uniform legal trick cards) or "greedy". Discards and the Fool's card are always chosen by the
// cheap policies (a random discard would drown the value of the card being judged).
export function rollout(hand, ctx, mode, rng, counter, slip = SLIP) {
	while (!hand.isOver()) {
		const seat = hand.toAct()[0];
		let legal = hand.legal(seat);
		if (!legal.length) break;
		const extra = extraAction(ctx, hand, seat, legal);
		if (extra) { if (!hand.apply(seat, extra).ok) break; counter.plays++; continue; }
		// a claim that is not valid is never made, unless nothing else is offered
		if (legal.some((x) => x.type === 'claim_fuora') && legal.some((x) => x.type !== 'claim_fuora')) legal = legal.filter((x) => x.type !== 'claim_fuora');
		let a = legal[0];
		const mine = hand.s.hands[seat];
		if (isContractLegal(legal)) {
			// bidding, the exchange, the call, declarations: the bot's own policies, for every seat (declarations also with one option)
			a = contractAction(ctx, mine, legal, legal.some((x) => x.type === 'pass') ? hand.view(seat).bidding : null) || a;
		} else if (legal.length > 1) {
			const type = a.type;
			if (type === 'play') a = mode === 'greedy' && rng.next() >= slip ? greedyPlay(ctx, legal, hand.s.trick, seat, hand.sides().of) : legal[rng.int(legal.length)];
			else if (type === 'discard') a = greedyDiscard(ctx, legal, mine);
			else if (type === 'fool_give') a = foolGive(ctx, legal);
			else a = legal.find((x) => x.type === 'a_monte_pass') || legal.find((x) => x.type === 'a_monte_agree') || legal[0];
		}
		if (!hand.apply(seat, a).ok) break;
		counter.plays++;
	}
	return hand.result();
}

// The world score for `seat`: win_weight*sign(margin) + margin in book points (a margin is its side's points less
// the best other side's, reversed when the fewest points win).
export function scoreOf(result, ctx, seat, level, hand) {
	if (!result) return 0;
	return level.win_weight * winSign(result, seat) + (ctx.hasContracts ? moneyOf(result, seat, ctx) : marginOf(result, ctx, seat, hand));
}

// Money of a hand with contracts for one seat, in book points: what it received less what it paid, as units of the
// Onoranza (the first onoranza payment and the contract's own figure give the unit) times five points a unit.
const POINTS_PER_UNIT = 5;
export function moneyOf(result, seat, ctx) {
	const pays = result.payments || [];
	if (!pays.length) return 0;
	let net = 0;
	for (const p of pays) net += (p.to === seat ? p.amount : 0) - (p.from === seat ? p.amount : 0);
	return (net / unitOf(result, ctx)) * POINTS_PER_UNIT;
}

// the money of one Onoranza unit (from the Onoranza payment of the result), else the least amount paid in it
function unitOf(result, ctx) {
	const o = ctx && ctx.contracts.find((c) => c.id === result.contract);
	const pay = o && o.onoranza > 0 ? result.payments.find((p) => p.why === 'onoranza' && p.amount > 0) : null;
	if (pay) return pay.amount / o.onoranza;
	let u = Infinity;
	for (const p of result.payments) if (p.amount > 0 && p.amount < u) u = p.amount;
	return Number.isFinite(u) ? u : 1;
}

function winSign(result, seat) {
	return result.winners.includes(seat) ? 1 : result.winners.length ? -1 : 0;
}

// the margin alone, in book points (what `temperature` is measured in)
export function marginOf(result, ctx, seat, hand) {
	if (!result) return 0;
	const sideOf = hand ? hand.sides().of : ctx.sideOf;
	let sp = result.sidePoints;
	if ((!sp || !Object.keys(sp).length) && hand) { // first_out: the result has no side points; count what each side won
		sp = {};
		for (let q = 0; q < sideOf.length; q++) sp[sideOf[q]] = (sp[sideOf[q]] || 0) + handPoints(ctx, hand, q) * 12;
	}
	if (!sp) return 0;
	const mine = sideOf[seat];
	const others = Object.keys(sp).filter((k) => Number(k) !== mine).map((k) => sp[k]);
	let margin = 0;
	if (others.length) margin = ctx.sign > 0 ? sp[mine] - Math.max(...others) : Math.min(...others) - sp[mine];
	return margin / 12;
}
