// validate-rulesets: two deals and two discards counted card by card, and the length of the action types.
// Temporary copies only.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyRulesets, validate, gameFile, mutate, cleanup } from './helpers.mjs';

after(cleanup);

const phase = (g, id) => g.hand.phases.find((p) => p.id === id);
const setOn = (game, fn) => {
	const root = copyRulesets();
	mutate(gameFile(root, game), fn);
	return validate(root);
};
const SOURCE = '[S] test';

test('the real two-deal file passes the arithmetic (26+25, 13+12 away, 15+12, 3 away, 25 each)', () => {
	const r = validate(copyRulesets());
	assert.doesNotMatch(r.out, /mitigati_2.*\n.*(tricks could not|cards are left|are left|discards \d+ but holds)/);
	assert.doesNotMatch(r.out, /the tricks could not be played out/);
});

test('count_mode up_to in the first discard leaves the hand sizes open: refused', () => {
	const r = setOn('mitigati_2', (g) => { phase(g, 'discard_first').settings.count_mode.value = 'up_to'; });
	assert.equal(r.code, 1);
	assert.match(r.out, /count_mode up_to leaves the hand sizes open/);
});

test('a first discard of 12 for the dealer leaves unequal hands', () => {
	const r = setOn('mitigati_2', (g) => { phase(g, 'discard_first').settings.count.value = { by_role: { dealer: 12, non_dealer: 12 } }; });
	assert.equal(r.code, 1);
	assert.match(r.out, /the tricks could not be played out|cannot be shared/);
});

test('half_rest needs a number of cards that the seats can share', () => {
	const r = setOn('mitigati_2', (g) => { phase(g, 'deal_second').settings.dealer_extra.value = 2; });
	assert.equal(r.code, 1);
	assert.match(r.out, /25 cards cannot be shared by 2 seats|the tricks could not be played out/);
});

test('half_rest without from: rest is refused', () => {
	const r = setOn('mitigati_2', (g) => { delete phase(g, 'deal_second').settings.from; });
	assert.equal(r.code, 1);
	assert.match(r.out, /half_rest needs from: rest/);
});

test('a discard of more cards than the dealer holds is refused', () => {
	const r = setOn('mitigati_2', (g) => { phase(g, 'discard_second').settings.count.value = 40; });
	assert.equal(r.code, 1);
	assert.match(r.out, /discards 40 but holds/);
});

test('a declaration kind whose action would be longer than 24 characters is refused', () => {
	const r = setOn('bagattultimo', (g) => {
		const k = phase(g, 'declarations').settings.kinds.value;
		k[0].id = 'a_very_long_kind_name';
	});
	assert.equal(r.code, 1);
	assert.match(r.out, /declare_a_very_long_kind_name must be 1-24 letters/);
});

test('a declaration kind with a digit in its id is refused (the journal takes only a-z and _)', () => {
	const r = setOn('bagattultimo', (g) => { phase(g, 'declarations').settings.kinds.value[0].id = 'onori2'; });
	assert.equal(r.code, 1);
	assert.match(r.out, /declare_onori2 must be 1-24 letters/);
});

test('a contract id whose action bid_<id> is too long is refused', () => {
	const r = setOn('bagattultimo', (g) => { g.contracts = [{ id: 'abcdefghijklmnopqrstu', source: SOURCE }]; });
	assert.equal(r.code, 1);
	assert.match(r.out, /bid_abcdefghijklmnopqrstu must be 1-24 letters/);
});
