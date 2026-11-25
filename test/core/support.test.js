// loadGame, checkSupport, the alts, the options and the variants.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadGame, checkSupport, MODULE_VERSIONS, VERSION, newHand } from '../../core/index.js';
import { getFile, load, loadPatched, CASES, playRandom } from './helpers.js';

test('the six files are runnable at their seat counts', () => {
	for (const [id, seats] of CASES) {
		const g = load(id, seats);
		assert.equal(g.support.runnable, true, `${id}: ${JSON.stringify(g.support.missing)}`);
		assert.equal(g.id, id);
		assert.equal(g.seats, seats);
		assert.ok(Number.isInteger(g.revision) && g.revision >= 1, 'the revision key is a positive integer');
		assert.equal(g.revision, getFile(id).revision);
		assert.equal(g.version, VERSION);
		assert.deepEqual(g.chain, [id]);
	}
});

test('the fifteen other files load without throwing; what is not played is listed', () => {
	const dir = new URL('../../rulesets/', import.meta.url);
	const six = ['venticinque', 'morto', 'venticinque_3', 'partita_3', 'partita_4', 'meno'];
	for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
		const id = f.slice(0, -5);
		if (six.includes(id)) continue;
		const file = getFile(id);
		const sc = file.seats.count.value;
		const seats = Array.isArray(sc) ? sc[0] : sc;
		const g = loadGame(id, getFile, { seats });
		assert.equal(typeof g.support.runnable, 'boolean');
		for (const m of g.support.missing) {
			assert.equal(typeof m.path, 'string');
			assert.ok('module' in m && 'key' in m && 'value' in m && typeof m.why === 'string');
		}
	}
	// the games with a bidding, a call, an exchange or declarations are played now (revision 7)
	for (const [id, n] of [['permesso_3', 3], ['chiamare_il_re', 4], ['bagattultimo', 3], ['mitigati_2', 2]]) assert.equal(loadGame(id, getFile, { seats: n }).support.runnable, true, id);
});

test('the module versions are numbers of the form x.y.z', () => {
	for (const [k, v] of Object.entries(MODULE_VERSIONS)) assert.match(v, /^\d+\.\d+\.\d+$/, k);
	assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('options: defaults, a chosen value, a bad value; option:<id> groups and agreed stakes', () => {
	const g = load('partita_4', 4);
	assert.deepEqual(g.options, { group: 2, stake: 1 });
	assert.equal(g.plan.find((e) => e.module === 'count').set.group, 2);
	const g4 = load('partita_4', 4, { options: { group: 4, stake: 5 } });
	assert.equal(g4.plan.find((e) => e.module === 'count').set.group, 4);
	assert.equal(g4.support.runnable, true);
	assert.throws(() => load('partita_4', 4, { options: { group: 3 } }));
	assert.throws(() => load('partita_4', 4, { options: { nothing: 1 } }));
	// the stake reaches the payments
	let paid = 0;
	for (let i = 0; i < 20 && !paid; i++) {
		const h = playRandom(g4, 'st' + i, 0, null);
		for (const p of h.result().payments) { assert.equal(p.amount, 5); paid++; }
	}
	assert.ok(paid > 0);
});

test('a group of four counts the whole pack the same: 864 twelfths (72 points, revision 9: the rest is a short group)', () => {
	const g4 = load('partita_4', 4, { options: { group: 4 } });
	for (let i = 0; i < 10; i++) {
		const h = playRandom(g4, 'g4' + i, i % 4, null);
		assert.equal(h.result().sidePoints[0] + h.result().sidePoints[1], 864, 'all 78 cards are counted: 4 x 19 + 2, the odd cards as a short group');
	}
});

test('variants: patched leaves, a variant the file lacks is an error; the meno short games are offered only at the seats where they pass the gate', () => {
	// revision 10: the short variants of Meno are back (the tie rule is `share`); each is limited to the numbers of seats where 200 random hands
	// have a winner in at least 85 % and several winners in at most 50 %: four cards two and three seats, eight cards two to five seats
	const playable = (variant, n) => { try { return load('meno', n, { variant }).support.runnable; } catch { return false; } };
	for (const n of [2, 3]) assert.equal(playable('four_cards', n), true, `four_cards at ${n} seats`);
	for (const n of [4, 5, 6, 7]) assert.equal(playable('four_cards', n), false, `four_cards at ${n} seats`);
	for (const n of [2, 3, 4, 5]) assert.equal(playable('eight_cards', n), true, `eight_cards at ${n} seats`);
	for (const n of [6, 7]) assert.equal(playable('eight_cards', n), false, `eight_cards at ${n} seats`);
	const meno = load('meno', 3);
	assert.deepEqual(meno.rules.variants.map((x) => x.id), ['four_cards', 'eight_cards']);
	assert.deepEqual((meno.rules.left_out || []).map((x) => x.id), ['vola'], 'only the vola stays out');
	assert.equal(load('meno', 3, { variant: 'four_cards' }).plan.find((e) => e.module === 'deal').set.hand_size, 4);
	assert.equal(load('meno', 3, { variant: 'eight_cards' }).plan.find((e) => e.module === 'deal').set.hand_size, 8);
	assert.throws(() => load('meno', 3, { variant: 'nothing' }));
	const f = load('partita_4', 4, { variant: 'four_deals' });
	assert.equal(f.cfg.match.kind, 'fixed_hands');
	assert.equal(f.cfg.match.hands, 4);
	assert.equal(f.support.runnable, true);
});

test('by_seats values are resolved to the seat count at the table', () => {
	for (const [n, size] of [[2, 25], [3, 25], [4, 19], [5, 15], [6, 13], [7, 11]]) {
		const g = load('meno', n);
		assert.equal(g.plan.find((e) => e.module === 'deal').set.hand_size, size);
		const leaf = g.rules.hand.phases.find((p) => p.id === 'deal').settings.hand_size;
		assert.equal(leaf.value, size);
	}
});

test('extends: the child file holds what differs; the never-inherited keys stay the child\'s', () => {
	const files = {
		base: { format: 3, id: 'base', about: 'x', status: 'documented', seats: { count: { value: 2, source: '[S] a' } }, sides: { mode: { value: 'each_for_self', source: '[S] a' } }, cards: { deck: { value: 'full78', source: '[S] a' } }, hand: { phases: [{ id: 'deal', module: 'deal', settings: { hand_size: { value: 25, source: '[S] a' }, dead: { value: 'out', source: '[S] a' } } }, { id: 'discard', module: 'discard', settings: { who: { value: 'dealer', source: '[S] a' } } }, { id: 'tricks', module: 'tricks', settings: {} }, { id: 'count', module: 'count', settings: {} }, { id: 'result', module: 'result', settings: {} }] } },
		kid: { format: 3, id: 'kid', extends: 'base', about: 'y', hand: { phases: [{ id: 'discard', remove: true }, { id: 'deal', settings: { hand_size: { value: 20, source: '[S] b' } } }, { id: 'extra', module: 'settle', after: 'result', settings: {} }] } },
	};
	const g = loadGame('kid', (id) => files[id], { seats: 2 });
	assert.deepEqual(g.chain, ['kid', 'base']);
	assert.equal(g.rules.id, 'kid');
	assert.equal(g.rules.status, undefined, 'status is not inherited');
	assert.deepEqual(g.rules.hand.phases.map((p) => p.id), ['deal', 'tricks', 'count', 'result', 'extra']);
	assert.equal(g.plan[0].set.hand_size, 20);
	assert.equal(g.plan[0].set.dead, 'out');
});

test('alts: every leaf with an alt is listed with whether the core plays it', () => {
	const g = load('partita_3', 3);
	const alts = Object.fromEntries(g.support.alts.map((a) => [a.path, a]));
	assert.deepEqual(Object.keys(alts).sort(), [
		'cards.fool_exchange', 'cards.fool_exchange_to', 'cards.fool_no_tricks', 'hand.phases[discard].settings.allowed_exceptions',
		'hand.phases[discard].settings.counts_for', 'hand.phases[discard].settings.discard_honours_barred',
		'match.dealer_rounds', 'seats.dealer_rotation',
	]);
	assert.equal(alts['match.dealer_rounds'].alt, 2, 'the table may agree on two rounds');
	assert.equal(alts['match.dealer_rounds'].supported, true);
	assert.deepEqual(alts['hand.phases[discard].settings.allowed_exceptions'].alt, [], 'the alt: no exception at all');
	assert.equal(alts['hand.phases[discard].settings.counts_for'].alt, 'discarder_unless_no_tricks');
	assert.equal(alts['cards.fool_no_tricks'].alt, 'give_fool');
	assert.equal(alts['hand.phases[tricks].settings.first_leader'], undefined, 'revision 9: no declarer reading at Partita');
	assert.equal(alts['seats.dealer_rotation'].supported, true);
	assert.equal(alts['cards.fool_exchange'].supported, true);
	assert.equal(alts['hand.phases[discard].settings.allowed_exceptions'].supported, true);
	assert.equal(alts['hand.phases[discard].settings.counts_for'].supported, true);
	assert.equal(alts['cards.fool_no_tricks'].supported, true);
	const v = load('venticinque', 2);
	assert.deepEqual(v.support.alts.map((a) => [a.path, a.alt, a.supported]), [
		['seats.dealer_rotation', 'loser_deals', true], ['cards.fool_exchange_card', 'owner_choice', true], ['hand.phases[discard].settings.counts_for', 'nobody', true], ['hand.phases[count].settings.dealer_forfeit', true, true],
	]);
	const p4 = load('partita_4', 4);
	assert.ok(p4.support.alts.some((a) => a.path === 'seats.first_dealer' && a.alt === 'draw_high' && a.supported));
	assert.deepEqual(load('meno', 2).support.alts.map((a) => [a.path, a.alt, a.supported]), [['cards.fool_exchange_to', 'opponent_side', true], ['match.dealer_rounds', 2, true], ['hand.phases[result].settings.tie', 'no_game_points', true], ['hand.phases[settle].settings.mode', 'losers_pay_winner', true]]);
	assert.equal(load('meno', 3, { alts: ['match.dealer_rounds'] }).cfg.match.dealer_rounds, 2);
});

test('alts are applied by path and play the other reading, and only that one', () => {
	const base = load('partita_3', 3);
	const alt = load('partita_3', 3, { alts: ['cards.fool_exchange', 'hand.phases[discard].settings.discard_honours_barred'] });
	assert.deepEqual(alt.alts, ['cards.fool_exchange', 'hand.phases[discard].settings.discard_honours_barred']);
	assert.equal(alt.cfg.cards.fool_exchange, false);
	assert.equal(base.cfg.cards.fool_exchange, true);
	assert.equal(alt.plan.find((e) => e.id === 'discard').set.discard_honours_barred, false);
	// nothing else changed
	const strip = (g) => { const r = JSON.parse(JSON.stringify(g.rules)); delete r.hand.phases.find((p) => p.id === 'discard').settings.discard_honours_barred; delete r.cards.fool_exchange; return r; };
	assert.deepEqual(strip(alt), strip(base));
	// the honours are free to go with the alt
	const h = newHand(alt, { seed: 'alt', dealer: 0, preset: null });
	assert.equal(h.legal(0).length, 28);
	const h0 = newHand(base, { seed: 'alt', dealer: 0 });
	assert.ok(h0.legal(0).length < 28);
	// no exchange with the alt: nobody gives a card
	for (let i = 0; i < 20; i++) assert.equal(playRandom(alt, 'ne' + i, 0, null).s.foolGive, null);
	assert.throws(() => load('partita_3', 3, { alts: ['cards.fool'] }), /no alt/);
	assert.throws(() => load('partita_3', 3, { alts: ['cards.nothing'] }));
	const rot = load('venticinque', 2, { alts: ['seats.dealer_rotation'] });
	assert.equal(rot.cfg.seats.dealer_rotation, 'loser_deals');
});

test('checkSupport on a patched file lists the path, the module, the key, the value and why', () => {
	const f = getFile('venticinque');
	f.hand.phases.find((p) => p.id === 'tricks').settings.play_from = { value: 'pile_tops', source: '[S] t' };
	f.hand.phases.find((p) => p.id === 'count').settings.fool_card = { value: 'deducted', source: '[S] t' };
	const g = loadGame('venticinque', () => f, { seats: 2 });
	assert.equal(g.support.runnable, false);
	const m = g.support.missing.find((x) => x.path === 'hand.phases[tricks].settings.play_from');
	assert.deepEqual([m.module, m.key, m.value], ['tricks', 'play_from', 'pile_tops']);
	assert.ok(g.support.missing.some((x) => x.path === 'hand.phases[count].settings.fool_card' && x.value === 'deducted'));
	assert.deepEqual(checkSupport(g.rules, 2).missing, g.support.missing);
	const unknown = getFile('venticinque');
	unknown.hand.phases.find((p) => p.id === 'tricks').settings.nothing = { value: 1, source: '[S] t' };
	assert.ok(loadGame('venticinque', () => unknown, { seats: 2 }).support.missing.some((x) => x.key === 'nothing'));
});

test('a dealer_forfeit of true and a loser_deals rotation are played', () => {
	const g = loadPatched('venticinque', 2, (f) => { f.hand.phases.find((p) => p.id === 'count').settings.dealer_forfeit.value = true; f.seats.dealer_rotation.value = 'loser_deals'; });
	assert.equal(g.support.runnable, true);
});
