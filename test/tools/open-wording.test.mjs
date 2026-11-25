// The open wording (revision 3): the checks of the validator and the normalisation used with --f2.
// Only the tests that do not need a list of words kept apart.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyRulesets, validate, gameFile, mutate, findLeaf, cleanup } from './helpers.mjs';
import { openWordingProblems, compileInternalWords } from '../../tools/validate-rulesets.mjs';
import { openWording, openWordingDeep, LEGEND } from '../../tools/open-wording.mjs';

after(cleanup);

// Puts `text` into the source of the first [D] leaf of meno.json (after the mark) and validates the copy.
const withSource = text => {
	const root = copyRulesets();
	mutate(gameFile(root, 'meno'), g => { const [, leaf] = findLeaf(g, n => n.source.startsWith('[D] ')); leaf.source = '[D] ' + text; });
	return validate(root).out;
};

test('a Cyrillic mark in a source fails', () => {
	const root = copyRulesets();
	mutate(gameFile(root, 'meno'), g => { const [, leaf] = findLeaf(g, n => n.source.startsWith('[D] ')); leaf.source = leaf.source.replace('[D]', '[\u0414]'); });
	assert.match(validate(root).out, /FAIL rulesets.meno\.json[\s\S]*does not match|Cyrillic mark/);
	assert.deepEqual(openWordingProblems({ a: { source: '[\u041f] x' } }).map(x => x.includes('Cyrillic mark')), [true]);
});

test('a Cyrillic letter outside short_ru fails; inside short_ru it passes', () => {
	assert.match(withSource('Torino 1787, p. 3: \u043f\u0440\u043e\u0431\u0430'), /Cyrillic letter outside «short_ru»/);
	assert.deepEqual(openWordingProblems({ sources: { x: { short_ru: '\u0414\u0430\u043c\u043c\u0435\u0442 (1980)', short_en: 'Dummett (1980)' } } }), []);
	assert.equal(openWordingProblems({ sources: { x: { cite: '\u0414' } } }).length, 1);
});

// The dates are put together here, so that this file holds no date written with dots itself.
const dotted = (...parts) => parts.join('.');

test('a date written with dots fails; a section number and a percentage are not dates', () => {
	assert.match(withSource('Torino 1787, p. 3: checked on ' + dotted('02', '11')), /a date written with dots/);
	assert.match(withSource('Torino 1787, p. 3: checked on ' + dotted('23', '11', '2026')), /a date written with dots/);
	assert.deepEqual(openWordingProblems({ a: 'see GAME_FILE_FORMAT 11.12 and FORMAT_OPEN_POINTS point 6.3; 1.32 % of the deals; p. 12.5' }), []);
	assert.equal(openWordingProblems({ a: 'on ' + dotted('02', '11') + ' we checked' }).length, 1);
});

test('the real game files have no problem of the open wording', () => {
	const root = copyRulesets();
	assert.doesNotMatch(validate(root).out, /Cyrillic|internal word|written with dots/);
});

test('openWording: the old wording of a format 2 file becomes the new one, nothing else changes', () => {
	assert.equal(openWording('[\u0414] a, [\u041f] b, [\u041d] c'), '[D] a, [R] b, [S] c');
	assert.equal(openWording('x. Marks: [\u0414] documented, [\u041f] probable, [\u041d] ours.'), 'x. ' + LEGEND);
	assert.equal(openWording('pays 3 marks; 1 mark; Marks: no; marked; trademark'), 'pays 3 marche; 1 marca; Marks: no; marked; trademark');
	assert.deepEqual(openWordingDeep({ a: ['[\u0414] mark', 3, null], b: { c: 'marks' } }), { a: ['[D] marca', 3, null], b: { c: 'marche' } });
});

test('a leaf marked unused still needs its value and its source', () => {
	const root = copyRulesets();
	mutate(gameFile(root, 'morto'), g => { delete g.match.target.source; });
	assert.match(validate(root).out, /FAIL/);
	const ok = copyRulesets();
	mutate(gameFile(ok, 'morto'), g => { g.match.target.unused = true; });
	assert.doesNotMatch(validate(ok).out, /unused/);
	const bad = copyRulesets();
	mutate(gameFile(bad, 'morto'), g => { g.match.target.unused = 'yes'; });
	assert.match(validate(bad).out, /unused/);
});


test('the list of internal words: words are substrings without case, patterns are regular expressions (neutral words)', () => {
	const list = compileInternalWords({ words: ['Foo.bar'], patterns: ['(?<![A-Za-z0-9_])(?i:quux)(?![A-Za-z0-9_])', '(?<![A-Za-z0-9_])Z\\d{1,2}(?![A-Za-z0-9_])'] });
	assert.equal(list.length, 3);
	const bad = s => openWordingProblems({ a: s }, list).length;
	assert.equal(bad('a FOO.BAR here'), 1, 'a word: a substring, case ignored');
	assert.equal(bad('a foo-bar here'), 0, 'a word is not a pattern: the dot is a dot');
	assert.equal(bad('a QUUX here'), 1, 'a pattern with (?i:)');
	assert.equal(bad('quuxes, AQUUX'), 0, 'a pattern with bounds: a word only');
	assert.equal(bad('code Z16 here'), 1);
	assert.equal(bad('Z100, AZ16, z16'), 0, 'a pattern without (?i:) is case-sensitive');
	assert.match(openWordingProblems({ a: 'a quux' }, list)[0], /the internal word «/);
	assert.deepEqual(compileInternalWords({}), []);
	assert.deepEqual(compileInternalWords(null), []);
	assert.deepEqual(openWordingProblems({ a: 'quux foo.bar' }, []), [], 'no list: no internal-word problem');
});
