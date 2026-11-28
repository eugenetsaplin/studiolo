// From the records of one run to one table row.
import { wilson, percentile, mean, sd, threshold, pairedInterval } from './stats.mjs';

const r3 = (x) => Math.round(x * 1000) / 1000;

export function rowOf({ id, seats, alts, a, b, pairs, recs, timing }) {
	const ok = recs.filter((r) => !r.error);
	const errors = recs.filter((r) => r.error);
	const n = ok.length;
	const share = mean(ok.map((r) => r.credit));
	const w = wilson(share, n);
	const sides = pairs ? 2 : seats;
	const all = ok.flatMap((r) => r.ms ?? []);
	const msAll = all.map((x) => x[0]);
	const msThink = all.filter((x) => x[1]).map((x) => x[0]);
	const q = (list) => (list.length ? { p50: r3(percentile(list, 0.5)), p95: r3(percentile(list, 0.95)), max: r3(Math.max(...list)), n: list.length } : null);
	const searched = ok.reduce((s, r) => s + r.searched, 0);
	const money = moneyRow(ok);
	// seat a minus the mean of the other seats: the game is zero-sum, so the money of a times n/(n-1), the interval scaled alike
	if (money.money && seats > 1) {
		const k = seats / (seats - 1);
		const m = money.money;
		money.moneyVsRest = { mean: r3(m.mean * k), lo: r3(m.lo * k), hi: r3(m.hi * k), n: m.n };
	}
	return {
		...money,
		game: id, seats, alts, a, b, pairs, hands: n,
		share: r3(share), fair: r3(1 / sides), lo: r3(w.lo), hi: r3(w.hi),
		margin: r3(mean(ok.map((r) => r.margin))), marginSd: r3(sd(ok.map((r) => r.margin))),
		decisions: ok.reduce((s, r) => s + r.decisions, 0),
		meanWorlds: searched ? r3(ok.reduce((s, r) => s + r.worlds, 0) / searched) : 0,
		threshold: threshold(seats, pairs),
		ms: timing ? { all: q(msAll), think: q(msThink) } : null,
		errors: errors.length, errorSamples: errors.slice(0, 3),
		// alts axis
		dealerShare: r3(mean(ok.map((r) => r.dealerCredit))),
		leaderShare: r3(mean(ok.map((r) => r.leaderCredit))),
		dealerMargin: r3(mean(ok.map((r) => r.dealerMargin))),
		dealerMarginSd: r3(sd(ok.map((r) => r.dealerMargin))),
		tieShare: r3(mean(ok.map((r) => r.tie))),
	};
}

// Money columns, only for games whose hands carry payments: the mean net payment of seat a per hand with its 95% interval,
// the thrown-in share, and the share of contracts won when seat a was the declarer.
function moneyRow(ok) {
	const m = ok.filter((r) => r.money !== undefined);
	if (!m.length) return {};
	const xs = m.map((r) => r.money);
	const mu = mean(xs);
	const se = sd(xs) / Math.sqrt(xs.length);
	const dec = ok.filter((r) => r.aDeclared);
	const won = dec.filter((r) => r.declaredWon).length;
	// the whole table (every seat may be the declarer): share of hands with a declarer, how many it won, its money
	const decl = m.filter((r) => r.contract !== undefined && r.declarerMoney !== undefined);
	const dm = decl.map((r) => r.declarerMoney);
	const dmu = mean(dm);
	const dse = dm.length > 1 ? sd(dm) / Math.sqrt(dm.length) : 0;
	const dwon = decl.filter((r) => r.declaredWon).length;
	const byKind = {};
	for (const r of ok) if (r.contract) byKind[r.contract] = (byKind[r.contract] ?? 0) + 1;
	return {
		money: { mean: r3(mu), lo: r3(mu - 1.96 * se), hi: r3(mu + 1.96 * se), sd: r3(sd(xs)), n: xs.length },
		thrownIn: r3(mean(m.map((r) => r.thrownIn ?? 0))),
		contracts: byKind,
		aDeclared: dec.length,
		declaredWonShare: dec.length ? r3(won / dec.length) : null,
		declaredWonLo: dec.length ? r3(wilson(won / dec.length, dec.length).lo) : null,
		table: {
			declaredShare: r3(decl.length / m.length),
			declarerWon: decl.length ? r3(dwon / decl.length) : null,
			declarerWonLo: decl.length ? r3(wilson(dwon / decl.length, decl.length).lo) : null,
			declarerWonHi: decl.length ? r3(wilson(dwon / decl.length, decl.length).hi) : null,
			declarerMoney: decl.length ? { mean: r3(dmu), lo: r3(dmu - 1.96 * dse), hi: r3(dmu + 1.96 * dse), n: decl.length } : null,
		},
	};
}

// Cyclic mode: the records are one per (deal, turn). Records are grouped by deal; a deal counts only when every turn of it was played
// without an error, and its observation is the mean over its turns. The row is the old row of the same games (rowOf: the games are
// the unit, Wilson interval, the interval of money by games) with the numbers of the interval replaced by the paired ones, and the old
// interval of those same games kept in `old` for comparison.
export function cyclicRowOf({ id, seats, alts, a, b, pairs, recs, turns, timing, safeT = false }) {
	const byDeal = new Map();
	for (const r of recs) { if (!byDeal.has(r.h)) byDeal.set(r.h, []); byDeal.get(r.h).push(r); }
	const full = [...byDeal.entries()].filter(([, rs]) => rs.length === turns && rs.every((r) => !r.error)).sort((x, y) => x[0] - y[0]);
	const okRecs = full.flatMap(([, rs]) => rs);
	const base = rowOf({ id, seats, alts, a, b, pairs, recs: okRecs, timing });
	const errors = recs.filter((r) => r.error);
	const half = (iv) => (iv.half === null ? null : r3(iv.half));
	const ivOut = (iv) => ({ mean: r3(iv.mean), lo: iv.lo === null ? null : r3(iv.lo), hi: iv.hi === null ? null : r3(iv.hi), half: half(iv) });
	const dealShare = full.map(([, rs]) => mean(rs.map((r) => r.credit)));
	const plain = pairedInterval(dealShare, { clamp: [0, 1] });
	const safe = pairedInterval(dealShare, { safe: true, clamp: [0, 1] });
	const old = { share: { lo: base.lo, hi: base.hi, half: r3((base.hi - base.lo) / 2) } };
	const row = {
		...base, mode: 'cyclic', turns, deals: full.length, hands: okRecs.length, errors: errors.length, errorSamples: errors.slice(0, 3),
		share: r3(plain.mean), lo: r3((safeT ? safe : plain).lo ?? 0), hi: r3((safeT ? safe : plain).hi ?? 1), safeT,
		interval: { share: ivOut(plain), safeShare: ivOut(safe) }, old,
	};
	if (base.money) {
		const dealMoney = full.map(([, rs]) => mean(rs.map((r) => r.money)));
		const iv = pairedInterval(dealMoney);
		row.money = { ...base.money, mean: r3(iv.mean), lo: iv.lo === null ? 0 : r3(iv.lo), hi: iv.hi === null ? 0 : r3(iv.hi), sd: r3(iv.sd), n: iv.n, half: half(iv) };
		old.money = { lo: base.money.lo, hi: base.money.hi, half: r3((base.money.hi - base.money.lo) / 2) };
		if (seats > 1) {
			const k = seats / (seats - 1);
			row.moneyVsRest = { mean: r3(iv.mean * k), lo: iv.lo === null ? 0 : r3(iv.lo * k), hi: iv.hi === null ? 0 : r3(iv.hi * k), half: iv.half === null ? null : r3(iv.half * k), n: iv.n };
			old.moneyVsRest = { half: r3((base.moneyVsRest.hi - base.moneyVsRest.lo) / 2) };
		}
	}
	return row;
}
