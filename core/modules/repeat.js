// repeat: a structural group, not a game mechanism. The phases nested in it (a deal and the tricks of a game with repeated deals) run
// again and again until a condition holds. The loader puts them into the plan with a group marker and the engine
// does the looping (Hand.advance); this file only names the module and says what it plays.
export const name = 'repeat';
export const version = '1.0.0';

export const UNTIL = ['fuora', 'stock_empty', 'fuora_or_stock_empty'];

export const supports = {
	until: UNTIL,
};

// the group needs a deal inside, and `fuora` in `until` needs a fuora hook
export function check(set, ctx) {
	const bad = [];
	const inner = (ctx.phase && ctx.phase.phases) || [];
	if (!inner.some((p) => p.module === 'deal')) bad.push({ key: 'until', value: set.until, why: 'a repeat group needs a deal phase inside' });
	if (!inner.some((p) => p.module === 'tricks')) bad.push({ key: 'until', value: set.until, why: 'a repeat group needs a tricks phase inside' });
	if (String(set.until).includes('fuora') && !ctx.phases.some((p) => p.module === 'fuora')) bad.push({ key: 'until', value: set.until, why: 'until fuora needs a fuora phase' });
	return bad;
}

export function enter() { return { events: [], done: true }; }
export function toAct() { return []; }
export function legal() { return []; }
export function apply() { return { ok: false }; }
