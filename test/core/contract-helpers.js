// Helpers of the call-the-King and exchange tests: Permesso for three and calling the King, with the new leaves set on a copy.
import { newHand, replayHand } from '../../core/index.js';
import { loadPatched, build } from './helpers.js';

export { build };

function phaseOf(f, id) { return f.hand.phases.find((p) => p.id === id); }

function patchExchange(f) {
	const e = phaseOf(f, 'exchange');
	if (!e) return;
	e.settings.give = { value: 'random' };
	e.settings.discard_honours_barred = { value: true };
	e.settings.allowed_exceptions = { value: [{ any: ['T0'] }] };
}

// the real file; if the core cannot play its result or settle yet, the same game with plain ones (the phases are the same)
function load2(id, seats) {
	const real = loadPatched(id, seats, patchExchange);
	if (real.support.runnable) return real;
	return loadPatched(id, seats, (f) => { patchExchange(f); simplify(f); });
}

export const permesso = (seats = 3) => load2('permesso_' + seats, seats);
export const king = () => load2('chiamare_il_re', 4);

// the dealer puts cards away, never one of `keep`; the auction: `bids` is {seat: contract id}, everybody else passes
export function drive(h, until, bids = {}, keep = []) {
	let guard = 0;
	while (h.s.phase !== until && !h.isOver()) {
		if (guard++ > 200) throw new Error('stuck in ' + h.s.phase);
		const seat = h.toAct()[0];
		let a;
		if (h.s.phase === 'discard') a = h.legal(seat).find((x) => !keep.includes(x.card));
		else if (h.s.phase === 'bidding') {
			const want = bids[seat] ? 'bid_' + bids[seat] : 'pass';
			a = h.legal(seat).find((x) => x.type === want) || h.legal(seat).find((x) => x.type === 'pass');
		} else a = h.legal(seat)[0];
		if (!a || !h.apply(seat, a).ok) throw new Error('cannot drive ' + h.s.phase);
	}
	return h;
}

export function start(game, wants, sizes, dealer = 0, seed = 'k2') {
	const init = { seed, dealer, preset: build(sizes, wants) };
	return { h: newHand(game, init), init };
}

export function replays(game, init, h) {
	const r = replayHand(game, init, h.log);
	return r.checksum() === h.checksum();
}

// plain result and settle phases (a fallback of load2)
function simplify(f) {
	for (const p of f.hand.phases) {
		if (p.module === 'result') p.settings = { winner: { value: 'threshold' }, target: { value: 46 }, tie: { value: 'draw' }, game_points: { value: 'none' } };
		if (p.module === 'settle') { p.settings = { unit: { value: 'stake' }, mode: { value: 'loser_pays_winner' }, amount: { value: { stake: 'agreed' } } }; }
	}
}
