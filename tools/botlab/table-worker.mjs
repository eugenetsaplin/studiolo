// Worker thread of tools/play.mjs --summary: plays hands from..to at one table and sends a short record of each.
import { parentPort } from 'node:worker_threads';
import { resolvePlayers, playTable, moneyBySeat } from './table.mjs';

let cache = null;
parentPort.on('message', async ({ id, job }) => {
	const recs = [];
	try {
		const key = job.bots.join('\n');
		if (!cache || cache.key !== key) cache = { key, players: await resolvePlayers(job.bots) };
		for (let h = job.from; h < job.to; h++) {
			const t = playTable({ id: job.id, seats: job.seats, variant: job.variant, seed: job.seed, h }, cache.players);
			const res = t.finished ? t.hand.result() : null;
			recs.push({ h, finished: t.finished, outcome: res?.outcome ?? null, winners: res ? res.winners.length : 0, money: res ? moneyBySeat(res, job.seats) : null });
		}
	} catch (e) {
		recs.push({ h: job.from, error: String(e.message).slice(0, 400), fatal: true });
	}
	parentPort.postMessage({ id, recs });
});
