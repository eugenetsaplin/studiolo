// Selectors (format 3, 5.2) and conditions (8.3). A selector compiles to a predicate (card, env) => boolean.
// env = {sets: {name: selector}, values: {card: book value} | null, options: {id: value}, seats: n}
// A card test may also get a per-seat "scope" {hand: [ids]} for the "if" form.
import { INFO } from './cards.js';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

export const CONDITION_KEYS = ['seats', 'option', 'hand_has', 'hand_lacks', 'hand_count'];

export function compileSelector(sel, env, depth = 0) {
	if (depth > 20) throw new Error('selector too deep');
	if (typeof sel === 'string') return compileString(sel, env, depth);
	if (Array.isArray(sel)) {
		const parts = sel.map((s) => compileSelector(s, env, depth + 1));
		return (c, scope) => parts.some((p) => p(c, scope));
	}
	if (isObj(sel)) {
		const tests = [];
		if (sel.any) { const p = compileSelector(sel.any, env, depth + 1); tests.push(p); }
		if (sel.all) {
			const ps = sel.all.map((s) => compileSelector(s, env, depth + 1));
			tests.push((c, scope) => ps.every((p) => p(c, scope)));
		}
		if (sel.not !== undefined) { const p = compileSelector(sel.not, env, depth + 1); tests.push((c, scope) => !p(c, scope)); }
		if (sel.if !== undefined) { const cond = compileCondition(sel.if, env); tests.push((c, scope) => cond(scope)); }
		return (c, scope) => tests.every((t) => t(c, scope));
	}
	throw new Error('bad selector');
}

function compileString(s, env, depth) {
	if (s === 'all') return () => true;
	if (s === 'trumps') return (c) => INFO[c].trump;
	if (s === 'suits') return (c) => !INFO[c].trump;
	if (s === 'counters') return (c) => env.values ? env.values[c] > 1 : false;
	if (s === 'plain') return (c) => env.values ? env.values[c] <= 1 : true;
	if (s.startsWith('rank:')) { const r = s.slice(5); return (c) => !INFO[c].trump && INFO[c].rank === r; }
	if (s.startsWith('suit:')) { const r = s.slice(5); return (c) => INFO[c].suit === r; }
	if (s.startsWith('set:')) {
		const name = s.slice(4);
		const def = env.sets && env.sets[name];
		if (def === undefined) throw new Error('no set ' + name);
		return compileSelector(def, env, depth + 1);
	}
	if (s in INFO) return (c) => c === s;
	throw new Error('unknown selector ' + s);
}

export function compileCondition(cond, env) {
	const tests = [];
	for (const [k, v] of Object.entries(cond)) {
		if (k === 'seats') tests.push(() => v.includes(env.seats));
		else if (k === 'option') tests.push(() => Object.entries(v).every(([id, val]) => env.options && env.options[id] === val));
		else if (k === 'hand_has') { const p = compileSelector(v, env); tests.push((scope) => !!scope && scope.hand.some((c) => p(c, scope))); }
		else if (k === 'hand_lacks') { const p = compileSelector(v, env); tests.push((scope) => !scope || !scope.hand.some((c) => p(c, scope))); }
		else if (k === 'hand_count') {
			const p = compileSelector(v.of, env);
			tests.push((scope) => {
				const n = scope ? scope.hand.filter((c) => p(c, scope)).length : 0;
				return (v.min === undefined || n >= v.min) && (v.max === undefined || n <= v.max);
			});
		} else tests.push(() => false);
	}
	return (scope) => tests.every((t) => t(scope));
}

export function conditionUnsupported(cond) {
	return Object.keys(cond).filter((k) => !CONDITION_KEYS.includes(k));
}

export function expandSelector(sel, env, scope, from) {
	const p = compileSelector(sel, env);
	return from.filter((c) => p(c, scope));
}
