// Where the tools keep what does not belong in the repository: raw outputs of runs, snapshots, reports.
// The folder is, strongest first:
//   1. the environment variable STUDIOLO_WORK;
//   2. "work" in tools/workdir.local.json (a local file, not part of an export; a relative path counts from the
//      repository root);
//   3. «out» in the repository root (listed in .gitignore).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function localWork() {
	try {
		const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'workdir.local.json'), 'utf8'));
		return typeof j.work === 'string' && j.work ? path.resolve(ROOT, j.work) : null;
	} catch { return null; }
}

export const WORK = process.env.STUDIOLO_WORK
	? path.resolve(process.env.STUDIOLO_WORK)
	: (localWork() || path.resolve(ROOT, 'out'));
