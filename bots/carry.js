// The carry of a rebuilt hand. A bot builds its worlds without the data of the match, but the rules of the hand may depend on
// it: a seat that cannot lose the match any more must lead a trump, else a king (tricks.out_leads). The view says who is
// bound (view.outLead.seats); the rebuilt hand gets a carry that makes the same seats bound and nothing else.
// `carry` is what the caller built (lastTaker or null); the result is that carry with the match part added when needed.
export function withOutCarry(game, view, carry) {
	const seats = view && view.outLead && Array.isArray(view.outLead.seats) ? view.outLead.seats : [];
	const mc = game.cfg && game.cfg.match;
	if (!seats.length || !mc || !Number.isInteger(mc.round_target)) return carry;
	const totals = Array.from({ length: game.seats }, (_, q) => (seats.includes(q) ? mc.round_target * 12 + 1 : 0));
	const handIndex = view.match && Number.isInteger(view.match.handIndex) ? view.match.handIndex : 0;
	return { ...(carry || {}), match: { kind: mc.kind, handIndex, last: true, totals } };
}
