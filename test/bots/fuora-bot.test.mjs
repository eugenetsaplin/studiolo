// Revision 11. «Fuora» is said by the player (Sedici, Trent'uno): nobody says it for him. The bot says it in its own turn
// as soon as it has the target, in the last window says it when it has the target and passes when it has not, never says it
// falsely.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, newHand } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { ctxOf, ownPoints } from '../../bots/policy.js';
import { getFile, level } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const easy = level('easy');
const normal = level('normal');
const ask = (g, v, seed, lv = easy) => chooseAction({ game: g, view: v, level: lv, seed });

// the game with another target of «fuora» (a copy of the file, the files on disk are never touched), to make the pack run out
function withTarget(id, seats, target, variant = null) {
	const get = (x) => {
		const f = JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets', x + '.json'), 'utf8'));
		const patch = (o) => {
			if (o && typeof o === 'object') {
				if (o.module === 'fuora' && o.settings && o.settings.target) o.settings.target.value = target;
				for (const k of Object.keys(o)) patch(o[k]);
			}
		};
		if (x === id) patch(f);
		return f;
	};
	return loadGame(id, get, { seats, variant });
}

// plays a hand of bots (levels alternate by seat and hand); visit(view, answer) sees every decision
function botHand(g, seed, dealer, levels, visit) {
	const h = newHand(g, { seed, dealer });
	for (let k = 0; !h.isOver(); k++) {
		assert.ok(k < 5000, 'the hand does not end');
		const q = h.toAct()[0];
		const v = h.view(q);
		const a = ask(g, v, `${seed}:${k}`, levels[q % levels.length]).action;
		if (visit) visit(v, a);
		assert.ok(h.apply(q, a).ok, `${seed}: ${JSON.stringify(a)} refused`);
	}
	return h;
}

const GAMES = [['sedici_2', 2, null], ['sedici_3', 3, null], ['sedici_4', 4, null], ['trentuno', 2, null], ['trentuno', 2, 'prammatica_1846']];

test('fuora: the bot claims exactly when it has the target, in every window and every turn, never falsely', () => {
	for (const [id, seats, variant] of GAMES.slice(0, 2).concat(GAMES.slice(3))) {
		const g = loadGame(id, getFile, { seats, variant });
		let claims = 0;
		for (let d = 0; d < 4; d++) {
			const h = botHand(g, `own${id}${variant}${d}`, d % seats, [easy, normal], (v, a) => {
				if (!v.legal.some((x) => x.type === 'claim_fuora')) return;
				const out = ownPoints(ctxOf(g), v) >= v.fuora.target;
				assert.equal(a.type === 'claim_fuora', out, `${id}: ${v.points.mine} of ${v.fuora.target}`);
				if (out) claims++;
			});
			const r = h.result();
			assert.equal(r.reason, 'fuora', `${id} ${variant}: the hand ends by a right claim`);
			assert.equal(r.winners.length, 1);
			assert.equal((r.payments || []).some((p) => p.why === 'false_claim'), false);
		}
		assert.ok(claims >= 4, `${id}: the bot said «fuora» ${claims} times`);
	}
});

// the target is raised so that the pack runs out: the last window opens, each seat chooses pass_fuora or claim_fuora
// (revision 14: a plain card of Sedici is worth 1, the pack holds 126 points, so the targets of Sedici are raised with it)
for (const [id, seats, target, variant] of [['sedici_2', 2, 57, null], ['trentuno', 2, 55, 'prammatica_1846'], ['sedici_3', 3, 40, null]]) {
	test(`fuora, the last window of ${id}${variant ? ' ' + variant : ''}: claim with the target, pass_fuora without it`, () => {
		const g = withTarget(id, seats, target, variant);
		const seen = { window: 0, claimed: 0, passed: 0, none: 0, ended: 0 };
		for (let d = 0; d < 150 && !(seen.window >= 20 && seen.claimed > 0 && seen.passed > 0); d++) {
			const h = botHand(g, `win${id}${d}`, d % seats, [easy], (v, a) => {
				if (!v.fuora || !v.fuora.lastWindow) return;
				seen.window++;
				assert.deepEqual(v.legal.map((x) => x.type), ['pass_fuora', 'claim_fuora']);
				const has = v.points.mine >= v.fuora.target;
				assert.equal(a.type, has ? 'claim_fuora' : 'pass_fuora', `${id}: ${v.points.mine} of ${v.fuora.target}`);
				if (has) seen.claimed++; else seen.passed++;
			});
			const r = h.result();
			assert.ok(r.reason === 'fuora' || r.reason === 'stock_empty', r.reason);
			assert.equal((r.payments || []).some((p) => p.why === 'false_claim'), false, 'no false claim');
			// a hand ends without a winner only when nobody in the window had the target (the bots pass without it)
			if (r.winners.length === 0) { assert.equal(r.reason, 'stock_empty'); seen.none++; } else seen.ended++;
		}
		assert.ok(seen.window > 0 && seen.passed > 0, `${id}: the window did not open (${JSON.stringify(seen)})`);
		assert.ok(seen.claimed > 0, `${id}: nobody claimed in a window (${JSON.stringify(seen)})`);
	});
}

test('fuora: bots of different levels play a game to a winner, not to the end of the pack', () => {
	for (const [id, seats, variant] of GAMES) {
		const g = loadGame(id, getFile, { seats, variant });
		const lv = [easy, normal];
		for (let d = 0; d < 3; d++) {
			const h = botHand(g, `mix${id}${variant}${d}`, d % seats, d % 2 ? lv.slice().reverse() : lv);
			assert.equal(h.result().reason, 'fuora', `${id} ${variant} deal ${d}`);
			assert.equal(h.result().winners.length, 1);
		}
	}
});
