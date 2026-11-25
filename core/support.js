// checkSupport: what in a (merged) game file the core does not play. Nothing unsupported is played silently as a
// default: every setting and value the core does not play is listed in `missing`, with its rule path.
import { MODULES } from './modules/index.js';
import { compileSelector } from './selectors.js';
import { valueTable, cardPointsSupported } from './points.js';
import { isObj, isLeaf, flatten, sameJson, roleValue } from './util.js';
import { DECK_SIZE } from './cards.js';

const list = (...a) => a;

// every phase of the file, the ones nested in a repeat group included (each with its group's id or null)
export function allPhases(rules) {
	const out = [];
	for (const ph of (rules.hand && rules.hand.phases) || []) {
		if (Array.isArray(ph.phases)) { out.push(ph); for (const q of ph.phases) out.push(Object.assign({}, q, { _group: ph.id })); }
		else out.push(ph);
	}
	return out;
}

function selectorsOk(v, env) {
	try { for (const x of v) compileSelector(x, env); return true; } catch { return false; }
}

// top-level settings (seats, sides, cards, match): array of played values, '*' for any, or a function
const TOP = {
	seats: {
		count: (v, c) => {
			const ok = Array.isArray(v) ? v.includes(c.seats) : v === c.seats;
			return ok || `this game is not played with ${c.seats} seats`;
		},
		direction: (v) => v === 'right' || 'only play to the right is played',
		first_dealer: list('draw_trump', 'draw_high', 'best_cut', 'random', 'host'),
		cut_by: list('left', 'right', 'none'),
		cut_min: '*',
		dealer_rotation: (v) => ['right', 'left', 'alternate', 'loser_deals', 'same', 'winner_passes_to_companion'].includes(v) || 'this rotation is not played',
		seating: (v, c) => {
			if (v === 'free') return true;
			if (v === 'partners_opposite' || v === 'partners_adjacent') return c.seats % 2 === 0 || 'pairs need an even number of seats';
			return 'this seating is not played';
		},
	},
	sides: {
		mode: (v, c) => {
			if (v === 'each_for_self') return true;
			if (v === 'by_contract') return allPhases(c.rules).some((p) => p.module === 'bidding') || 'the sides by contract need a bidding phase';
			if (v === 'fixed_pairs') return c.seats % 2 === 0 || 'pairs need an even number of seats';
			return 'this side mode needs a module the core lacks';
		},
		pool: list('seat', 'side'),
		partners_share_hands: list(true, false),
		partners_talk: '*',
		signals: '*',
	},
	cards: {
		deck: (v) => v === 'full78' || 'only the full 78-card pack is played',
		trump_order: (v) => {
			if (v === 'torino_1787' || v === 'printed') return true;
			if (Array.isArray(v) && v.every((x) => /^T\d+$/.test(x))) return true;
			return 'only torino_1787, printed and an explicit list are played';
		},
		suit_order: list('italian', 'straight'),
		card_points: (v) => cardPointsSupported(v) || 'unknown card_points tariff',
		fool: (v, c) => {
			if (v === 'excuse') return true;
			if (v !== 'trump') return 'only excuse and trump are played';
			// a trump Fool needs a place in the order of the trionfi
			const order = c.cfg.cards.trump_order;
			return (Array.isArray(order) && order.includes('T0')) || 'the Fool as a trump needs T0 in the explicit trump_order';
		},
		fool_exchange: list(true, false),
		fool_exchange_card: list('cheapest', 'owner_choice'),
		fool_exchange_to: list('opponent_side', 'trick_winner'),
		fool_no_tricks: list('give_none', 'give_fool'),
		fool_last_trick: list('kept'),
		fool_show_any_time: (v, c) => v === false || (v === true && allPhases(c.rules).some((p) => p.module === 'open_piles')) || 'showing the Fool at any time needs an open_piles phase',
		sets: (v, c) => (isObj(v) && Object.values(v).every((x) => selectorsOk(Array.isArray(x) ? x : [x], c.env))) || 'bad set',
	},
	match: {
		kind: list('single_hand', 'fixed_hands', 'race', 'running_total', 'ledger'),
		target: '*', hands: '*', tiebreak: list('none', 'card_points'), tie_replay: '*', max_hands: '*',
		max_stake: list(1), crawford: list(false), double_window_cards: '*', round_target: '*', rounds: '*',
		dealer_rounds: (v) => (Number.isInteger(v) && v >= 1) || 'a whole number of rounds, 1 or more',
		payout: payoutSupported,
	},
};

// The hands of the seats at the start of the tricks, when the file lets them be known before the play: only deal and
// discard phases (and phases that touch no hand) stand before the tricks. The dealer is seat 0. null: not known
// (a repeat group, piles, an exchange, a condition on the contract and the like): the check does not judge such a file.
const HAND_FREE = new Set(['declarations', 'bidding', 'count', 'result', 'settle']);
export function handsBeforeTricks(rules, seats) {
	const list = ((rules.hand && rules.hand.phases) || []);
	const sizes = new Array(seats).fill(0);
	let rest = DECK_SIZE;
	for (const ph of list) {
		if (ph.module === 'tricks') return sizes;
		if (ph.during || ph.module === 'fuora') continue;
		if (Array.isArray(ph.phases) || ph.module === 'repeat') return null;
		const set = {};
		for (const [k, leaf] of Object.entries(ph.settings || {})) set[k] = isLeaf(leaf) ? leaf.value : leaf;
		if (ph.module === 'deal') {
			if (ph.when || Array.isArray(set.piles) || set.dead === 'stock') return null;
			const extra = set.dealer_extra || 0;
			let per;
			if (set.hand_size === 'half_rest') {
				const each = Math.floor((rest - extra) / seats);
				per = sizes.map(() => each);
			} else per = sizes.map((_, q) => roleValue(set.hand_size, q, 0));
			if (per.some((x) => !Number.isInteger(x))) return null;
			for (let q = 0; q < seats; q++) { sizes[q] += per[q] + (q === 0 ? extra : 0); rest -= per[q] + (q === 0 ? extra : 0); }
		} else if (ph.module === 'discard') {
			if (ph.when) return null;
			let count = set.count;
			if (count === undefined) { const d = (list.find((p) => p.module === 'deal') || { settings: {} }).settings.dealer_extra; count = isLeaf(d) ? d.value : (d || 0); }
			for (let q = 0; q < seats; q++) {
				if (set.who === 'dealer' && q !== 0) continue;
				const c = roleValue(count, q, 0);
				if (!Number.isInteger(c)) return null;
				sizes[q] -= c;
			}
		} else if (!HAND_FREE.has(ph.module)) return null;
	}
	return null;
}

export function specCheck(spec, value, ctx) {
	if (spec === '*') return true;
	if (typeof spec === 'function') return spec(value, ctx);
	if (Array.isArray(spec)) {
		if (spec.some((x) => sameJson(x, value))) return true;
		return 'this value is not played (played: ' + spec.map((x) => JSON.stringify(x)).join(', ') + ')';
	}
	return 'not played';
}

// match.payout: 'per_hand' (the stake of each hand, as the settle phase says), 'match_end' (one payment at the end of the match with the
// mode and amount of the settle phase), or {at: 'match_end', mode, amount} with its own mode and amount (the values of settle).
const PAYOUT_MODES = ['loser_pays_winner', 'losers_pay_winner', 'winners_from_losers', 'pair_split'];
function payoutAmountOk(v, ctx) {
	if (typeof v === 'number') return Number.isFinite(v) && v >= 0;
	if (!isObj(v)) return false;
	if ('stake' in v) return ['simple', 'double', 'marcia', 'agreed'].includes(v.stake);
	if ('option' in v) return ((ctx.rules && ctx.rules.options) || []).some((o) => o.id === v.option);
	if ('sum' in v) return Array.isArray(v.sum) && v.sum.every((x) => payoutAmountOk(x, ctx));
	if ('times' in v) return Array.isArray(v.times) && v.times.every((x) => payoutAmountOk(x, ctx));
	return false;
}
function payoutSupported(v, ctx) {
	if (v === 'per_hand') return true;
	const m = (ctx.cfg && ctx.cfg.match) || {};
	const kind = m.kind || (m.hands === undefined ? 'single_hand' : m.hands > 0 ? 'fixed_hands' : 'race');
	let at = v;
	if (isObj(v)) {
		at = v.at === undefined ? 'match_end' : v.at;
		if (v.mode !== undefined && !PAYOUT_MODES.includes(v.mode)) return 'payout.mode is one of ' + PAYOUT_MODES.join(', ');
		if (v.amount !== undefined && !payoutAmountOk(v.amount, ctx)) return 'payout.amount: only numbers, stake, option, sum and times amounts are paid at the end of a match';
	}
	if (at !== 'match_end') return 'payout is per_hand, match_end, or {at: match_end, mode, amount}';
	if (kind === 'ledger' || kind === 'single_hand') return 'a payout at the end of the match needs a match that ends with a winner: fixed_hands, race or running_total';
	return true;
}

export function checkSupport(rules, seats) {
	const missing = [];
	const alts = [];
	const cfg = { seats: flatten(rules.seats), sides: flatten(rules.sides), cards: flatten(rules.cards), match: flatten(rules.match) };
	const tbl = valueTable(cfg.cards.card_points);
	const options = {};
	for (const o of rules.options || []) options[o.id] = o.default !== undefined ? o.default : (o.choices || [])[0];
	const env = { sets: cfg.cards.sets || {}, values: tbl ? tbl.v : null, options, seats };
	const base = { rules, seats, env, cfg };

	const note = (path, module, key, value, why) => missing.push({ path, module, key, value: value === undefined ? null : value, why });

	// the sections
	for (const [section, specs] of Object.entries(TOP)) {
		const node = rules[section];
		if (!isObj(node)) continue;
		for (const [key, leaf] of Object.entries(node)) {
			const value = isLeaf(leaf) ? leaf.value : leaf;
			const path = `${section}.${key}`;
			const spec = specs[key];
			if (spec === undefined) { note(path, section, key, value, 'this setting is not played'); continue; }
			const r = specCheck(spec, value, base);
			if (r !== true) note(path, section, key, value, r);
			if (isLeaf(leaf) && 'alt' in leaf && key !== 'sets') alts.push({ path, value, alt: leaf.alt, supported: specCheck(spec, leaf.alt, base) === true });
		}
	}

	// the phases
	const phases = allPhases(rules);
	const present = new Set();
	phases.forEach((ph0, idx) => {
		const { _group: group, ...ph } = ph0;
		present.add(ph.module);
		const mod = MODULES[ph.module];
		const ppath = group ? `hand.phases[${group}].phases[${ph.id}]` : `hand.phases[${ph.id}]`;
		if (!mod) { note(ppath, ph.module, null, null, 'the core has no module ' + ph.module); return; }
		const set = {};
		for (const [k, leaf] of Object.entries(ph.settings || {})) set[k] = isLeaf(leaf) ? leaf.value : leaf;
		const ctx = { ...base, set, phases, phaseIndex: idx, phase: ph };
		// a repeat group's own key is `until`, not a setting
		const entries = Object.entries(ph.settings || {});
		if (ph.module === 'repeat') {
			set.until = ph.until;
			const r = specCheck(mod.supports.until, ph.until, ctx);
			if (r !== true) note(`${ppath}.until`, 'repeat', 'until', ph.until, r);
		}
		for (const [key, leaf] of entries) {
			const value = set[key];
			const path = `${ppath}.settings.${key}`;
			const spec = mod.supports[key];
			if (spec === undefined) { note(path, ph.module, key, value, 'this setting is not played'); continue; }
			const r = specCheck(spec, value, ctx);
			if (r !== true) note(path, ph.module, key, value, r);
			if (isLeaf(leaf) && 'alt' in leaf) alts.push({ path, value, alt: leaf.alt, supported: specCheck(spec, leaf.alt, ctx) === true });
		}
		if (ph.module === 'deal' && set.dead === 'stock' && !group) note(`${ppath}.settings.dead`, 'deal', 'dead', 'stock', 'dead stock is played only inside a repeat group');
		if (ph.when) {
			const w = ph.when;
			const ids = (rules.contracts || []).map((c) => c.id);
			if (Object.keys(w).some((k) => !['seats', 'option', 'contract', 'all_passed'].includes(k))) note(`${ppath}.when`, ph.module, 'when', ph.when, 'this condition is not played');
			else if (w.contract !== undefined && !(Array.isArray(w.contract) && w.contract.every((x) => ids.includes(x)))) note(`${ppath}.when`, ph.module, 'when', ph.when, 'the condition names a contract the file does not have');
			else if ((w.contract !== undefined || w.all_passed !== undefined) && !phases.some((p) => p.module === 'bidding')) note(`${ppath}.when`, ph.module, 'when', ph.when, 'a condition on the contract needs a bidding phase');
		}
		if (mod.check) for (const b of mod.check(set, ctx)) note(`${ppath}.settings.${b.key}`, ph.module, b.key, b.value, b.why);
	});
	// every other leaf that carries an alt (phases of a module the core lacks, nested phases): not played
	const seen = new Set(alts.map((a) => a.path));
	const walk = (node, at) => {
		if (!node || typeof node !== 'object' || Array.isArray(node)) return;
		if (isLeaf(node) && 'alt' in node) {
			if (!seen.has(at)) { seen.add(at); alts.push({ path: at, value: node.value, alt: node.alt, supported: false }); }
			return;
		}
		for (const [k, v] of Object.entries(node)) {
			if (k === 'variants' || k === 'value' || k === 'source') continue;
			if (k === 'phases' && Array.isArray(v)) { for (const p of v) walk(p, `${at}.phases[${p.id}]`); continue; }
			walk(v, at ? `${at}.${k}` : k);
		}
	};
	walk(rules, '');
	// an impossible deal: the hands must be equal when the tricks start, or cards stay unplayed (or a trick comes up short)
	const hb = handsBeforeTricks(rules, seats);
	if (hb && hb.some((x) => x !== hb[0])) note('hand.phases', 'deal', null, hb, 'the hands are not equal when the tricks start (' + hb.join(', ') + '): some cards would never be played');
	for (const need of ['deal', 'tricks', 'count', 'result']) {
		if (!present.has(need)) note('hand.phases', need, null, null, `the file has no ${need} phase`);
	}

	for (const c of rules.contracts || []) {
		if (c.sides !== undefined && !['declarer_vs_rest', 'called_partner', 'each_for_self'].includes(c.sides)) note(`contracts[${c.id}].sides`, 'contracts', 'sides', c.sides, 'this contract side mode is not played');
		if (c.exchange !== undefined && !(Number.isInteger(c.exchange) && c.exchange >= 0)) note(`contracts[${c.id}].exchange`, 'contracts', 'exchange', c.exchange, 'a whole number of cards, 0 or more');
	}
	for (const p of rules.penalties || []) {
		if (p.enforce === 'apply' && !(p.offence === 'call_own_card' && present.has('call_partner'))) note(`penalties[${p.id}]`, 'penalties', 'enforce', 'apply', 'a penalty the engine would have to apply is not played');
	}
	const live = rules.view && rules.view.score_panel && rules.view.score_panel.live_points;
	if (live !== undefined && live !== 'hidden' && live !== 'own') note('view.score_panel.live_points', 'view', 'live_points', live, 'only hidden and own live points are played');

	// the other view settings: the core plays one reading of each
	const vw = rules.view || {};
	const vval = (x) => (isLeaf(x) ? x.value : x);
	const pd = vw.piles && vval(vw.piles.discard);
	if (pd !== undefined && pd !== 'owner_only') note('view.piles.discard', 'view', 'discard', pd, 'only owner_only is played');
	// view.partners_hands is not checked: a game file may say hidden while sides.partners_share_hands is true (an open point of the format)
	const lt = vval(vw.last_trick);
	if (lt !== undefined && lt !== 'until_next_lead') note('view.last_trick', 'view', 'last_trick', lt, 'closed tricks are always public history in this core');

	return { runnable: missing.length === 0, missing, alts };
}
