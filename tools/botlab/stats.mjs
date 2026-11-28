// Small statistics of the bot lab: Wilson interval, percentiles, thresholds, z tests. Pure.

export function wilson(p, n, z = 1.96) {
	if (n <= 0) return { lo: 0, hi: 1 };
	const d = 1 + (z * z) / n;
	const c = p + (z * z) / (2 * n);
	const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
	return { lo: Math.max(0, (c - m) / d), hi: Math.min(1, (c + m) / d) };
}

// nearest-rank percentile of a list of numbers; null for an empty list
export function percentile(list, q) {
	if (!list.length) return null;
	const s = [...list].sort((a, b) => a - b);
	return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
export function sd(xs) {
	if (xs.length < 2) return 0;
	const m = mean(xs);
	return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

// The strength threshold of the brief: share of won hands of a level against random robots.
// Pair games 0.70; otherwise 2 seats 0.70, 3 seats 0.60, 4 seats 0.45, 5: 0.36, 6: 0.30, 7: 0.26.
export function threshold(seats, pairs) {
	if (pairs) return 0.7;
	return { 2: 0.7, 3: 0.6, 4: 0.45, 5: 0.36, 6: 0.3, 7: 0.26 }[seats] ?? Math.min(0.7, 1.8 / seats);
}

// two shares (successes over n each): z of the difference
export function zShares(p1, n1, p2, n2) {
	const p = (p1 * n1 + p2 * n2) / (n1 + n2);
	const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
	return se > 0 ? (p1 - p2) / se : 0;
}
export function zMeans(a, b) {
	const se = Math.sqrt(sd(a) ** 2 / a.length + sd(b) ** 2 / b.length);
	return se > 0 ? (mean(a) - mean(b)) / se : 0;
}

// The two-sided 95 % quantile of Student's t with df degrees of freedom: a table up to 10, then the series in 1/df (error below 0.001).
const T975 = [NaN, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228];
export function tQuantile(df) {
	if (!(df >= 1)) return NaN;
	if (df <= 10) return T975[Math.round(df)];
	const z = 1.959964;
	return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2) + (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3);
}

// Paired interval of the cyclic mode: xs are the means of the deals (one number per deal), so the unit is the deal, not the game.
// mean +- t(0.975, D-1) * se. With safe (a share between 0 and 1 only): se^2 = (SS + 0.25) / D^2, with SS the sum of squares about the mean;
// the interval is wider than the plain one while the deals disagree little, and it never shrinks to a point when every deal gives the same
// number. clamp: [lo, hi] limits of the interval.
export function pairedInterval(xs, { safe = false, clamp = null } = {}) {
	const n = xs.length;
	if (n < 2) return { mean: n ? xs[0] : 0, lo: null, hi: null, half: null, n, sd: 0 };
	const m = mean(xs);
	const ss = xs.reduce((a, x) => a + (x - m) ** 2, 0);
	const se = safe ? Math.sqrt(ss + 0.25) / n : Math.sqrt(ss / (n - 1) / n);
	const half = tQuantile(n - 1) * se;
	let lo = m - half, hi = m + half;
	if (clamp) { lo = Math.max(clamp[0], lo); hi = Math.min(clamp[1], hi); }
	return { mean: m, lo, hi, half, n, sd: sd(xs) };
}
