// A small pool of worker threads. run(job) splits {from, to} into chunks and resolves with all records.
import { Worker } from 'node:worker_threads';

export class Pool {
	constructor(size, workerUrl = new URL('./worker.mjs', import.meta.url)) {
		this.workers = [];
		this.idle = [];
		this.queue = [];
		this.pending = new Map();
		this.nextId = 1;
		for (let i = 0; i < Math.max(1, size); i++) {
			const w = new Worker(workerUrl);
			w.on('message', ({ id, recs }) => {
				const p = this.pending.get(id);
				this.pending.delete(id);
				p.resolve(recs);
				this.idle.push(w);
				this.pump();
			});
			w.on('error', (e) => { for (const p of this.pending.values()) p.reject(e); });
			this.workers.push(w);
			this.idle.push(w);
		}
	}

	pump() {
		while (this.idle.length && this.queue.length) {
			const w = this.idle.pop();
			const { job, resolve, reject } = this.queue.shift();
			const id = this.nextId++;
			this.pending.set(id, { resolve, reject });
			w.postMessage({ id, job });
		}
	}

	chunk(job) {
		return new Promise((resolve, reject) => { this.queue.push({ job, resolve, reject }); this.pump(); });
	}

	async run(job) {
		const total = job.to - job.from;
		const size = Math.max(1, Math.min(25, Math.ceil(total / (this.workers.length * 2))));
		const parts = [];
		for (let f = job.from; f < job.to; f += size) parts.push(this.chunk({ ...job, from: f, to: Math.min(job.to, f + size) }));
		return (await Promise.all(parts)).flat().sort((x, y) => x.h - y.h);
	}

	async close() { await Promise.all(this.workers.map((w) => w.terminate())); }
}
