// Worker for determinism.test.mjs: answers {jobs: [{id, seats, view, level, seed}]} with the bot's answers.
// Run as a plain module (e.g. by the test runner) it does nothing.
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

if (!isMainThread && workerData && workerData.vbot) {
	const { chooseAction, parseLevel } = await import('../../bots/index.js');
	const { game } = await import('./lib.mjs');
	const out = workerData.jobs.map((j) => chooseAction({ game: game(j.id, j.seats), view: j.view, level: parseLevel(j.level), seed: j.seed }));
	parentPort.postMessage(out);
}
