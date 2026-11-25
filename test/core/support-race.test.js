// checkSupport of the new values: they are played only together with what they need; nested phases are checked.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPatched, CASES, load } from './helpers.js';

const paths = (g) => g.support.missing.map((m) => m.path);

test('the three games of the book for two are runnable', () => {
	for (const [id, n] of [['sedici_2', 2], ['trentuno', 2], ['baronetti', 2]]) assert.equal(load(id, n).support.runnable, true, id);
});

test('the old games are still runnable, with no new missing rule', () => {
	for (const [id, n] of CASES) assert.equal(load(id, n).support.runnable, true, id + ':' + n);
});

test('dead stock is played only inside a repeat group', () => {
	const g = loadPatched('venticinque', 2, (f) => { f.hand.phases.find((p) => p.module === 'deal').settings.dead = { value: 'stock', source: '[S] test' }; });
	assert.ok(paths(g).some((p) => p.endsWith('.dead')));
});

test('nested phases are checked like the others', () => {
	const g = loadPatched('sedici_2', 2, (f) => { f.hand.phases[0].phases[1].settings.must_overtrump.value = 'maybe'; });
	assert.equal(g.support.runnable, false);
	assert.ok(paths(g).includes('hand.phases[rounds].phases[tricks].settings.must_overtrump'));
});

test('a repeat group needs its until and a fuora phase for until fuora', () => {
	const g = loadPatched('sedici_2', 2, (f) => { f.hand.phases[0].until = 'never'; });
	assert.ok(paths(g).includes('hand.phases[rounds].until'));
	const h = loadPatched('sedici_2', 2, (f) => { f.hand.phases = f.hand.phases.filter((p) => p.id !== 'fuora'); });
	assert.equal(h.support.runnable, false);
});

test('play_from pile_tops and fool_show_any_time need an open_piles phase', () => {
	const a = loadPatched('sedici_2', 2, (f) => { f.hand.phases[0].phases[1].settings.play_from = { value: 'pile_tops', source: '[S] test' }; });
	assert.ok(paths(a).includes('hand.phases[rounds].phases[tricks].settings.play_from'));
	const b = loadPatched('sedici_2', 2, (f) => { f.cards.fool_show_any_time = { value: true, source: '[S] test' }; });
	assert.ok(paths(b).includes('cards.fool_show_any_time'));
});

test('the alt of claim_when (after_trick, revision 9) is played', () => {
	const g = load('sedici_2', 2);
	const alt = g.support.alts.find((a) => a.path === 'hand.phases[fuora].settings.claim_when');
	assert.equal(alt.alt, 'after_trick');
	assert.equal(alt.supported, true);
	const hold = g.support.alts.find((a) => a.path === 'hand.phases[fuora].settings.after_false_claim');
	assert.equal(hold.supported, true);
	const bad = loadPatched('sedici_2', 2, (f) => { f.view.score_panel.live_points = 'side'; });
	assert.ok(paths(bad).includes('view.score_panel.live_points'));
});
