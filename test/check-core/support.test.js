// Independent check of the core: checkSupport on all the files; an unsupported rule is listed, never played as a default.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSupport, newMatch } from '../../core/index.js';
import { allIds, getFile, load, loadWith, phaseOf, newH } from './lib.mjs';

function seatCounts(id) {
	let f = getFile(id);
	while (f.seats === undefined || f.seats.count === undefined) f = getFile(f.extends);
	const v = f.seats.count.value;
	return Array.isArray(v) ? v : [v];
}

const RUNNABLE = new Set(['venticinque', 'morto', 'venticinque_3', 'partita_3', 'partita_4', 'meno', 'consiglio', 'dottore', 'sedici_2', 'sedici_3', 'sedici_4', 'trentuno', 'baronetti', 'mitigati_2', 'bagattultimo', 'chiamare_il_re', 'permesso_3', 'permesso_4', 'permesso_5', 'permesso_6', 'permesso_7']);

test('all files load; runnable exactly the games whose modules exist; the others refuse to start a hand or a match', () => {
	const ids = allIds();
	assert.equal(ids.length, 21);
	for (const id of ids) {
		for (const n of seatCounts(id)) {
			const g = load(id, n);
			assert.equal(g.support.runnable, RUNNABLE.has(id), `${id}/${n}: ${JSON.stringify(g.support.missing.map((m) => m.path))}`);
			assert.equal(g.support.runnable, g.support.missing.length === 0);
			if (!g.support.runnable) {
				assert.throws(() => newH(g, 'x', 0));
				assert.throws(() => newMatch(g, { seed: 'x', firstDealer: 0 }));
				for (const m of g.support.missing) for (const k of ['path', 'module', 'key', 'value', 'why']) assert.ok(k in m, k);
			}
		}
	}
});

test('a module the core lacks is listed with key null (a phase renamed to a module that does not exist)', () => {
	for (const [id, n, phase] of [['chiamare_il_re', 4, 'bidding'], ['permesso_3', 3, 'bidding'], ['bagattultimo', 3, 'declarations'], ['mitigati_2', 2, 'declarations']]) {
		const g = loadWith(id, n, (f) => { phaseOf(f, phase).module = 'not_a_module'; });
		assert.equal(g.support.runnable, false);
		const m = g.support.missing.find((x) => x.module === 'not_a_module');
		assert.ok(m, `${id}: ${phase} not listed`);
		assert.equal(m.key, null);
	}
});

test('unsupported values of the six files\' settings are listed, not played', () => {
	const cases = [
		['venticinque', 2, (f) => { phaseOf(f, 'tricks').settings.first_leader.value = 'declarer'; }, 'hand.phases[tricks].settings.first_leader'],
		['venticinque', 2, (f) => { f.cards.fool_last_trick.value = 'lost'; }, 'cards.fool_last_trick'],
		['venticinque', 2, (f) => { f.cards.fool.value = 'trump'; }, 'cards.fool'],
		['venticinque', 2, (f) => { f.seats.direction.value = 'left'; }, 'seats.direction'],
		['venticinque', 2, (f) => { phaseOf(f, 'discard').settings.count_mode = { value: 'up_to', source: '[S] t' }; }, 'hand.phases[discard].settings.count_mode'],
		['venticinque', 2, (f) => { phaseOf(f, 'count').settings.last_trick_bonus.value = 10; }, 'hand.phases[count].settings.last_trick_bonus'],
		['venticinque', 2, (f) => { phaseOf(f, 'tricks').settings.wild = { value: 1, source: '[S] t' }; }, 'hand.phases[tricks].settings.wild'],
		['venticinque', 2, (f) => { f.view.score_panel.live_points = 'all'; }, 'view.score_panel.live_points'],
		['morto', 2, (f) => { phaseOf(f, 'morto').settings.per_trick.value = 2; }, 'hand.phases[morto].settings.per_trick'],
		['morto', 2, (f) => { phaseOf(f, 'morto').settings.goes_to.value = 'hand'; }, 'hand.phases[morto].settings.goes_to'],
		['morto', 2, (f) => { phaseOf(f, 'deal').settings.dead.value = 'out'; }, 'hand.phases[morto].settings.stock'],
		['partita_4', 4, (f) => { phaseOf(f, 'settle').settings.mode.value = 'a_scaricare'; }, 'hand.phases[settle].settings.mode'],
		['partita_4', 4, (f) => { f.sides.mode.value = 'called_partner'; }, 'sides.mode'],
		['meno', 5, (f) => { phaseOf(f, 'result').settings.winner.value = 'first_out'; }, 'hand.phases[result].settings.winner'],
		['meno', 2, (f) => { f.hand.phases = f.hand.phases.filter((p) => p.id !== 'count'); }, 'hand.phases'],
		['venticinque_3', 3, (f) => { f.match.kind.value = 'cup'; }, 'match.kind'],
		['venticinque', 2, (f) => { phaseOf(f, 'deal').settings.hand_size.value = 40; }, 'hand.phases[deal].settings.hand_size'],
	];
	for (const [id, n, change, path] of cases) {
		const g = loadWith(id, n, change);
		assert.equal(g.support.runnable, false, `${id}: ${path} accepted`);
		assert.ok(g.support.missing.some((m) => m.path === path), `${id}: ${path} not listed: ${JSON.stringify(g.support.missing.map((m) => m.path))}`);
	}
});

// revision 10: the short variants of Meno are played again, each at the numbers of seats where it passes the gate
test('meno variants four_cards and eight_cards are offered at the numbers of seats where they pass, and refused at the others', () => {
	const ok = (variant, n) => { try { return load('meno', n, { variant }).support.runnable; } catch { return false; } };
	assert.deepEqual([2, 3, 4, 5, 6, 7].filter((n) => ok('four_cards', n)), [2, 3]);
	assert.deepEqual([2, 3, 4, 5, 6, 7].filter((n) => ok('eight_cards', n)), [2, 3, 4, 5]);
	assert.equal(load('meno', 3, { variant: 'four_cards' }).support.runnable, true);
});

test('checkSupport is a pure function of the merged rules', () => {
	const g = load('partita_4', 4);
	assert.deepEqual(checkSupport(g.rules, 4), g.support);
	assert.equal(checkSupport(g.rules, 3).runnable, false, 'pairs at three seats');
});

test('seat counts the file does not allow are not runnable; by_seats resolves per table', () => {
	assert.equal(load('venticinque', 2).support.runnable, true);
	assert.equal(load('venticinque', 3).support.runnable, false);
	for (const [n, size] of [[2, 25], [3, 25], [4, 19], [5, 15], [6, 13], [7, 11]]) {
		assert.equal(load('meno', n).plan[0].set.hand_size, size);
	}
	assert.throws(() => load('meno', 8));
	assert.throws(() => load('meno', 1));
});
