// prize_stock (a hook of tricks): after each trick one card is drawn from the top of the stock and joins the won cards
// of the drawer (the trick's winner; for a trick in which the Fool was shown, fool_trick says who draws).
import { sideMap } from '../util.js';

export const name = 'prize_stock';
export const version = '1.0.0';
export const hook = 'tricks';

export const supports = {
	stock: ['rest'],
	per_trick: [1],
	take: ['top'],
	show_to: ['opponents', 'all', 'nobody'],
	goes_to: ['won_pile'],
	fool_trick: ['trick_winner', 'fool_owner', 'nobody'],
};

export function check(set, ctx) {
	const deal = ctx.phases.find((p) => p.module === 'deal');
	const dead = deal && deal.settings && deal.settings.dead;
	if (!deal || !dead || dead.value !== 'prize') return [{ key: 'stock', value: set.stock, why: 'the stock needs deal.dead = prize' }];
	return [];
}

export function afterTrick(h, entry, rec, index) {
	const s = h.s;
	const set = entry.set;
	let who = rec.winner;
	if (rec.fool !== null) {
		if (set.fool_trick === 'fool_owner') who = rec.fool;
		else if (set.fool_trick === 'nobody') who = null;
	}
	if (who === null || s.stock.length === 0) return [];
	const card = s.stock.shift();
	s.won[who].push(card);
	rec.prize = card;
	s.drawn.push({ trick: index, seat: who, card });
	return [{ e: 'stock_drawn', seat: who, card }];
}

// may `viewer` see the card that `drawer` took from the stock?
export function visibleTo(h, viewer, drawer) {
	if (viewer === drawer) return true;
	const hooks = h.game.hooks.tricks || [];
	const e = hooks.find((x) => x.module === 'prize_stock');
	const show = e ? e.set.show_to : 'opponents';
	if (show === 'all') return true;
	if (show === 'nobody') return false;
	const sides = sideMap(h.game.cfg, h.s.n);
	return sides.of[viewer] !== sides.of[drawer];
}
