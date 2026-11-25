// Census of whole matches played by random robots through the core: matches to the end, hands per match, thrown-in hands,
// draws, contracts won by kind, declarations by kind, the hands where the Bagatto (trump 1) was played in the last trick
// and where it won that trick. Reads core/ and bots/random.js, edits nothing.
//   node tools/botlab/census.mjs --games <id:seats,...> --hands N [--seed S] [--out file]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newMatch, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { getFile } from './play.mjs';

const BAGATTO = 'T1';
const bump = (o, k, n = 1) => { o[k] = (o[k] ?? 0) + n; };

export function census({ id, seats, hands, seed = 'census' }) {
	const game = loadGame(id, getFile, { seats });
	const row = { game: id, seats, hands: 0, matches: 0, matchesEnded: 0, handsInEnded: 0, thrownIn: 0, draws: 0, contracts: {}, declarations: {}, bagattoLast: 0, bagattoWon: 0, refused: 0, errors: 0 };
	for (let k = 0; row.hands < hands; k++) {
		const match = newMatch(game, { seed: `${seed}:${id}:${seats}:m${k}` });
		row.matches++;
		let inMatch = 0;
		for (;;) {
			const h = match.hand;
			const rng = makeRng(`${seed}:${id}:${seats}:m${k}:${inMatch}`);
			for (let step = 0; step < 8000 && !h.isOver(); step++) {
				const s = h.toAct()[0];
				const a = chooseAction(h.view(s).legal, rng);
				const r = h.apply(s, a);
				if (!r.ok) { row.refused++; break; }
				for (const e of r.events ?? []) {
					if (e.e === 'contract_won') bump(row.contracts, e.contract);
					if (e.e === 'declared') bump(row.declarations, e.kind);
				}
			}
			if (!h.isOver()) { row.errors++; return row; }
			row.hands++;
			inMatch++;
			const res = h.result();
			if (res.outcome === 'thrown_in') row.thrownIn++;
			if (res.outcome === 'draw') row.draws++;
			const last = h.snapshot().tricks.at(-1);
			if (last?.cards.some((c) => c.card === BAGATTO)) {
				row.bagattoLast++;
				if (last.cards.find((c) => c.seat === last.winner)?.card === BAGATTO) row.bagattoWon++;
			}
			if (match.isOver()) { row.matchesEnded++; row.handsInEnded += inMatch; break; }
			if (inMatch > 400) break; // a match that never ends is counted as not ended
			match.next();
		}
	}
	row.handsPerMatch = row.matchesEnded ? Math.round((10 * row.handsInEnded) / row.matchesEnded) / 10 : null;
	return row;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const argv = process.argv.slice(2);
	const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
	const games = arg('--games', '').split(',').filter(Boolean).map((s) => { const [id, n] = s.split(':'); return { id, seats: Number(n) }; });
	const rows = games.map((g) => census({ ...g, hands: Number(arg('--hands', 500)), seed: arg('--seed', 'census') }));
	for (const r of rows) console.log(JSON.stringify(r));
	if (arg('--out', null)) fs.writeFileSync(arg('--out'), JSON.stringify(rows, null, 1));
}
