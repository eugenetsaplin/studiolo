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
