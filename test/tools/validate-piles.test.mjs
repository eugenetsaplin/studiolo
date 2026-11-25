// validate-rulesets: the deal arithmetic sums deal.piles per seat (format open point 48). Temporary copies only.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyRulesets, validate, gameFile, mutate, cleanup } from './helpers.mjs';

after(cleanup);

const setPiles = (root, piles) => mutate(gameFile(root, 'baronetti'), g => {
	g.hand.phases.find(p => p.module === 'deal').settings.piles.value = piles;
});

test('a wrong list of piles fails the deal arithmetic, naming the cards left', () => {
	const root = copyRulesets();
	setPiles(root, [10, 10, 10, 8]);
	const r = validate(root);
	assert.equal(r.code, 1);
	assert.match(r.out, /dead .none. but 2 cards are left/);
});

test('piles that need more than the pack fail', () => {
	const root = copyRulesets();
	setPiles(root, [10, 10, 10, 10]);
	const r = validate(root);
	assert.equal(r.code, 1);
	assert.match(r.out, /needs 80 cards, the deck has 78/);
});

test('the real list of piles passes the arithmetic (no deal message)', () => {
	const root = copyRulesets();
	const r = validate(root);
	assert.doesNotMatch(r.out, /cards are left|the deck has 78/);
});
