// Bot check: strength and time, a second opinion. Not a unit test (minutes): run by hand.
//   node test/check-bot/strength.mjs --run strength <id:seats> [hands=100] [level=normal]
//   node test/check-bot/strength.mjs --run time <level> [hands=10]
//   node test/check-bot/strength.mjs --run fallback <level> [hands=10]
// strength: one bot seat (rotating), every other seat the random robot; the same deals are played again with the
// random robot in the bot's seat (paired baseline). Prints one JSON line.
// Run as a plain module (e.g. by the test runner) it does nothing.
import { newHand, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { chooseAction as randomAction } from '../../bots/random.js';
import { PAIRS, game, level } from './lib.mjs';

function playOne(g, d, botSeat, lv) {
	const n = g.seats;
	const h = newHand(g, { seed: 'vstr:' + d, dealer: (d >> 1) % n });
	const rng = makeRng('vstr:r:' + d);
	let k = 0;
	const ms = [];
	while (!h.isOver()) {
		const q = h.toAct()[0];
		let a;
		if (q === botSeat && lv) {
			const t = performance.now();
			a = chooseAction({ game: g, view: h.view(q), level: lv, seed: `vb:${d}:${k}` }).action;
			ms.push(performance.now() - t);
		} else a = randomAction(h.legal(q), rng);
		if (!h.apply(q, a).ok) throw new Error('refused');
		k++;
	}
	const r = h.result();
	const mine = g.sides.of[botSeat];
	const others = Object.keys(r.sidePoints).filter((x) => Number(x) !== mine).map((x) => r.sidePoints[x]);
	const sign = g.plan.find((e) => e.module === 'result').set.winner === 'fewest_points' ? -1 : 1;
	const margin = (sign * (r.sidePoints[mine] - others.reduce((s, x) => s + x, 0) / others.length)) / 12;
	return { win: r.winners.includes(botSeat) ? 1 : 0, margin, ms };
}

function strength(pair, hands, lvName) {
	const [id, n] = pair.split(':');
	const g = game(id, Number(n));
	const lv = level(lvName);
	let w = 0; let w0 = 0; let m = 0; let m0 = 0; const ms = [];
	for (let d = 0; d < hands; d++) {
		const seat = d % g.seats;
		const a = playOne(g, d, seat, lv);
		const b = playOne(g, d, seat, null);
		w += a.win; w0 += b.win; m += a.margin; m0 += b.margin; ms.push(...a.ms);
	}
	ms.sort((x, y) => x - y);
	console.log(JSON.stringify({ pair, level: lvName, hands, bot_wins: w, random_wins_same_deals: w0, bot_margin: +(m / hands).toFixed(2), random_margin: +(m0 / hands).toFixed(2),
		ms_mean: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(1), ms_p95: +ms[Math.floor(ms.length * 0.95)].toFixed(1), ms_max: +ms[ms.length - 1].toFixed(1) }));
}

function time(lvName, hands, fallbackOnly) {
	const lv = level(lvName);
	for (const [id, n] of PAIRS) {
		const g = game(id, n);
		const ms = [];
		let fb = 0; let multi = 0;
		for (let d = 0; d < hands; d++) {
			const h = newHand(g, { seed: `vtime:${id}:${d}`, dealer: d % n });
			const rng = makeRng('vtime:' + d);
			let k = 0;
			while (!h.isOver()) {
				const q = h.toAct()[0];
				const v = h.view(q);
				let a;
				if (q === d % n) {
					const t = performance.now();
					const r = chooseAction({ game: g, view: v, level: lv, seed: `vt:${d}:${k}` });
					ms.push(performance.now() - t);
					if (v.legal.length > 1 && (v.legal[0].type === 'play' || v.legal[0].type === 'discard')) { multi++; if (r.stats.worlds === 0 && r.eval.length === 1 && r.eval[0].value === 0) fb++; }
					a = r.action;
				} else a = randomAction(h.legal(q), rng);
				h.apply(q, a);
				k++;
			}
		}
		ms.sort((x, y) => x - y);
		const line = { pair: `${id}:${n}`, level: lvName, decisions: ms.length, ms_mean: +(ms.reduce((s, x) => s + x, 0) / ms.length).toFixed(1), ms_p95: +ms[Math.floor(ms.length * 0.95)].toFixed(1), ms_max: +ms[ms.length - 1].toFixed(1), card_decisions: multi, no_world_or_noise: fb };
		console.log(JSON.stringify(line));
	}
}

const argv = process.argv.slice(2);
if (argv[0] === '--run') {
	if (argv[1] === 'strength') strength(argv[2], Number(argv[3] || 100), argv[4] || 'normal');
	else if (argv[1] === 'time') time(argv[2] || 'normal', Number(argv[3] || 10));
	else if (argv[1] === 'fallback') time(argv[2] || 'easy', Number(argv[3] || 10), true);
}
