// Worker thread of the bot lab: plays a chunk of hands and sends the records back.
// A job may carry aBot, the file:// address of a solver's bot module; the worker loads it once.
import { parentPort } from 'node:worker_threads';
import { playHand } from './play.mjs';
import { loadBot } from './solver.mjs';

const bots = new Map();

parentPort.on('message', async ({ id, job }) => {
	const recs = [];
	let botFn = null;
	try {
		if (job.aBot) {
			if (!bots.has(job.aBot)) bots.set(job.aBot, await loadBot(job.aBot));
			botFn = bots.get(job.aBot);
		}
	} catch (e) {
		for (let h = job.from; h < job.to; h++) recs.push({ h, error: String(e.message).slice(0, 300), botError: true });
		parentPort.postMessage({ id, recs });
		return;
	}
	for (let h = job.from; h < job.to; h++) {
		try { recs.push(playHand({ ...job, h, botFn })); } catch (e) { recs.push({ h, error: 'lab_threw: ' + String(e.message).slice(0, 160) }); }
	}
	parentPort.postMessage({ id, recs });
});
