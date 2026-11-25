// loadGame: merge the file chain (format 3, 7.3), apply the variant, the options and the alts, resolve by_seats,
// build the plan the engine runs. Pure: the caller reads the files (getFile).
import { ALL, INFO } from './cards.js';
import { compileCondition } from './selectors.js';
import { valueTable } from './points.js';
import { checkSupport } from './support.js';
import { MODULES } from './modules/index.js';
import { isObj, isLeaf, clone, flatten, leafValue as val, sideMap } from './util.js';

export const CORE_VERSION = '1.0.0';

const RUNTIME_WHEN = ['contract', 'all_passed'];
const NEVER_INHERITED = ['id', 'about', 'status', 'converted_from'];

function mergeInto(base, patch, inHand) {
	if (isLeaf(patch)) return clone(patch);
	if (isObj(base) && isObj(patch) && !isLeaf(base)) {
		const out = { ...base };
		for (const k of Object.keys(patch)) {
			if (inHand && k === 'phases') out.phases = mergePhases(base.phases || [], patch.phases);
			else out[k] = k in base ? mergeInto(base[k], patch[k], k === 'hand') : clone(patch[k]);
		}
		return out;
	}
	return clone(patch);
}

function mergePhases(parent, child) {
	const out = clone(parent);
	for (const c of child) {
		const at = out.findIndex((p) => p.id === c.id);
		if (c.remove) { if (at >= 0) out.splice(at, 1); continue; }
		if (at >= 0) {
			const p = out[at];
			const merged = { ...p, ...clone(c) };
			merged.settings = mergeInto(p.settings || {}, c.settings || {}, false);
			out[at] = merged;
		} else {
			const ins = clone(c);
			const after = c.after ? out.findIndex((p) => p.id === c.after) : -1;
			if (after >= 0) out.splice(after + 1, 0, ins); else out.push(ins);
		}
	}
	return out;
}

function mergeChain(id, getFile, seen = []) {
	if (seen.includes(id)) throw new Error('extends loop at ' + id);
	const file = getFile(id);
	if (!isObj(file)) throw new Error('no game file ' + id);
	if (!file.extends) return { merged: clone(file), chain: [id] };
	const up = mergeChain(file.extends, getFile, [...seen, id]);
	const base = clone(up.merged);
	for (const k of NEVER_INHERITED) delete base[k];
	return { merged: mergeInto(base, clone(file), false), chain: [id, ...up.chain] };
}

// by_seats values become the entry for this table's seat count
function resolveSeats(node, n) {
	if (Array.isArray(node)) return node.map((x) => resolveSeats(x, n));
	if (!isObj(node)) return node;
	const out = {};
	for (const [k, v] of Object.entries(node)) {
		if ((k === 'value' || k === 'alt') && isObj(v) && 'by_seats' in v) {
			const pick = v.by_seats[String(n)];
			out[k] = pick === undefined ? v : clone(pick);
		} else if (k === 'sources') out[k] = v;
		else out[k] = resolveSeats(v, n);
	}
	return out;
}

function resolveOptionRefs(node, options) {
	if (Array.isArray(node)) return node.map((x) => resolveOptionRefs(x, options));
	if (!isObj(node)) return node;
	const out = {};
	for (const [k, v] of Object.entries(node)) {
		if (k === 'value' && typeof v === 'string' && v.startsWith('option:') && v.slice(7) in options) out[k] = options[v.slice(7)];
		else out[k] = resolveOptionRefs(v, options);
	}
	return out;
}

function parsePath(path) {
	return path.split('.').map((tok) => {
		const m = /^([A-Za-z0-9_]+)(?:\[([^\]]+)\])?$/.exec(tok);
		if (!m) throw new Error('bad alt path ' + path);
		return { key: m[1], sel: m[2] };
	});
}

function applyAlt(rules, path) {
	let node = rules;
	for (const { key, sel } of parsePath(path)) {
		if (!node || node[key] === undefined) throw new Error('no such path ' + path);
		node = node[key];
		if (sel !== undefined) {
			node = Array.isArray(node) ? (/^\d+$/.test(sel) ? node[Number(sel)] : node.find((e) => e && e.id === sel)) : undefined;
			if (node === undefined) throw new Error('no such path ' + path);
		}
	}
	if (!isLeaf(node) || !('alt' in node)) throw new Error('the leaf has no alt: ' + path);
	node.value = node.alt;
	delete node.alt;
}

function trumpOrder(v) {
	const printed = [];
	for (let t = 21; t >= 1; t--) printed.push('T' + t);
	if (v === 'printed') return printed;
	if (v === 'torino_1787') return ['T20', 'T21', ...printed.filter((x) => x !== 'T20' && x !== 'T21')];
	return Array.isArray(v) ? v : null;
}

function buildTables(cfg) {
	const order = trumpOrder(cfg.cards.trump_order) || trumpOrder('torino_1787');
	const trumpStrength = {};
	order.forEach((id, i) => { trumpStrength[id] = order.length - i; });
	const straight = cfg.cards.suit_order === 'straight';
	const suitStrength = {};
	for (const id of ALL) {
		const c = INFO[id];
		if (c.trump) continue;
		const reversed = !straight && (c.suit === 'cups' || c.suit === 'coins') && c.num <= 10;
		suitStrength[id] = reversed ? 11 - c.num : c.num;
	}
	return { values: valueTable(cfg.cards.card_points) || valueTable('honours_4_angel'), trumpStrength, suitStrength, trumpOrder: order };
}

export function loadGame(id, getFile, opts = {}) {
	const { merged, chain } = mergeChain(id, getFile);
	let rules = merged;

	const variantId = opts.variant || null;
	if (variantId) {
		const v = (rules.variants || []).find((x) => x.id === variantId);
		if (!v) throw new Error('no variant ' + variantId);
		rules = mergeInto(rules, clone(v.patch), false);
	}

	let seats = opts.seats;
	if (seats === undefined) {
		const sc = val(rules.seats && rules.seats.count);
		if (Number.isInteger(sc)) seats = sc;
	}
	if (!Number.isInteger(seats) || seats < 2 || seats > 7) throw new Error('seats must be an integer 2..7');

	const alts = opts.alts || [];
	for (const p of alts) applyAlt(rules, p);

	rules = resolveSeats(rules, seats);

	const options = {};
	for (const o of rules.options || []) options[o.id] = o.default !== undefined ? o.default : o.choices[0];
	for (const [k, v] of Object.entries(opts.options || {})) {
		const o = (rules.options || []).find((x) => x.id === k);
		if (!o) throw new Error('no option ' + k);
		if (!o.choices.some((c) => c === v)) throw new Error('bad value for option ' + k);
		options[k] = v;
	}
	rules = resolveOptionRefs(rules, options);

	const cfg = {
		seats: flatten(rules.seats), sides: flatten(rules.sides), cards: flatten(rules.cards), match: flatten(rules.match),
	};
	const env = { sets: cfg.cards.sets || {}, values: null, options, seats };

	// phases that do not run at this table are dropped (the nested ones of a repeat group too)
	// (contract and all_passed are judged at run time by the engine: they stay on the plan entry)
	const staticWhen = (w) => Object.fromEntries(Object.entries(w).filter(([k]) => !RUNTIME_WHEN.includes(k)));
	const runs = (p) => {
		if (!p.when) return true;
		try { return compileCondition(staticWhen(p.when), env)(null); } catch { return true; }
	};
	const phases = ((rules.hand && rules.hand.phases) || []).filter(runs).map((p) => (Array.isArray(p.phases) ? { ...p, phases: p.phases.filter(runs) } : p));
	rules.hand = { ...(rules.hand || {}), phases };

	const plan = [];
	const hooks = {};
	const addEntry = (p) => {
		const set = {};
		for (const [k, leaf] of Object.entries(p.settings || {})) set[k] = val(leaf);
		const entry = { id: p.id, module: p.module, set, mod: MODULES[p.module] || null };
		if (p.when) {
			const w = Object.fromEntries(Object.entries(p.when).filter(([k]) => RUNTIME_WHEN.includes(k)));
			if (Object.keys(w).length) entry.when = w;
		}
		if (p.during) (hooks[p.during] = hooks[p.during] || []).push(entry);
		else plan.push(entry);
		return entry;
	};
	for (const p of phases) {
		if (p.module === 'repeat' && Array.isArray(p.phases)) {
			// a repeat group: its inner phases join the plan, each marked with the group (indices in the plan)
			const first = plan.length;
			const inner = [];
			for (const q of p.phases) { const e = addEntry(q); if (!q.during) inner.push(e); }
			const group = { id: p.id, until: p.until, first, last: plan.length - 1 };
			for (const e of inner) e.group = group;
		} else addEntry(p);
	}
	// discard.count defaults to deal.dealer_extra (format 11.2)
	const dealEntry = plan.find((e) => e.module === 'deal');
	for (const e of plan) if (e.module === 'discard' && e.set.count === undefined && dealEntry) e.set.count = dealEntry.set.dealer_extra || 0;

	const support = checkSupport(rules, seats);
	const tables = buildTables(cfg);
	env.values = tables.values.v;

	return {
		id, seats, chain, rules, alts: [...alts], revision: rules.revision || null, support, version: CORE_VERSION,
		variant: variantId, options, cfg, contracts: rules.contracts || [], plan, hooks, tables, env, sides: sideMap(cfg, seats),
	};
}
