// Helpers of the declaration tests (declarations, event payments, the second deal). Until the registry and settle of the core
// know the new modules, they are put in by hand: a no-op once the core has them.
import { MODULES } from '../../core/modules/index.js';
import * as declarations from '../../core/modules/declarations.js';
import * as settle from '../../core/modules/settle.js';
import { paymentsSupport } from '../../core/modules/payments.js';
import { newHand } from '../../core/index.js';
import { build } from './helpers.js';

if (!MODULES.declarations) MODULES.declarations = declarations;
if (Array.isArray(settle.supports.payments)) settle.supports.payments = paymentsSupport;

export { load, loadPatched, getFile, checkConserved, playRandom } from './helpers.js';

export const HONOURS = ['swords:K', 'batons:K', 'cups:K', 'coins:K', 'T20', 'T0', 'T1'];
const plain = (c) => !HONOURS.includes(c);

// a three-seat deal with a dealer's extra three (dealer 0: 28, 25, 25 cards): the wanted cards of each seat;
// seats 1 and 2 get no other honour (the dealer takes the honours nobody asked for)
export function bagattDeal(game, wants, seed = 'k3') {
	const noHonour = (c) => HONOURS.includes(c);
	const p = build([28, 25, 25], wants, [null, noHonour, noHonour]);
	return newHand(game, { seed, dealer: 0, preset: p });
}

// the dealer puts away three plain cards
export function dealerDiscards(h) {
	for (let i = 0; i < 3; i++) {
		const a = h.legal(0).find((x) => x.type === 'discard' && plain(x.card));
		if (!h.apply(0, a).ok) throw new Error('discard refused');
	}
}
