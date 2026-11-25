// Small helpers shared by the loader, the support check, the engine and the modules.
export const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
export const isLeaf = (x) => isObj(x) && 'value' in x;
export const leafValue = (x) => (isLeaf(x) ? x.value : x);
export const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

// a section of leaves -> plain values
export function flatten(section) {
	const out = {};
	if (!isObj(section)) return out;
	for (const [k, v] of Object.entries(section)) {
		if (k === 'sets' && isObj(v)) { out.sets = {}; for (const [n, s] of Object.entries(v)) out.sets[n] = leafValue(s); }
		else out[k] = leafValue(v);
	}
	return out;
}

// {by_role: {dealer, non_dealer, others}} -> the number for this seat
export function roleValue(v, seat, dealer) {
	if (!isObj(v) || !('by_role' in v)) return v;
	const r = v.by_role;
	if (seat === dealer) return r.dealer !== undefined ? r.dealer : r.others;
	return r.non_dealer !== undefined ? r.non_dealer : r.others;
}

export function sameJson(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

// the seat at +k (right is +1) from `seat`
export function seatAt(seat, k, n) {
	return (((seat + k) % n) + n) % n;
}

// Sides: seat -> side id. each_for_self: every seat is its own side; fixed_pairs by the seating.
export function sideMap(cfg, n) {
	const mode = cfg.sides.mode || 'each_for_self';
	const of = [];
	for (let s = 0; s < n; s++) {
		if (mode === 'fixed_pairs') of.push(cfg.seats.seating === 'partners_adjacent' ? Math.floor(s / 2) : s % (n / 2));
		else of.push(s);
	}
	return { mode, of, pool: cfg.sides.pool || (mode === 'each_for_self' ? 'seat' : 'side') };
}

export function seatsOfSide(sides, side) {
	const out = [];
	sides.of.forEach((x, s) => { if (x === side) out.push(s); });
	return out;
}
