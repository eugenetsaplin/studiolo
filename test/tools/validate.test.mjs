// validate-rulesets: G6 (revisions), G5 (by), replace, deal piles. Always on temporary copies of rulesets/.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { copyRulesets, validate, gameFile, mutate, findLeaf, mark, cleanup, lastRevision, REPO } from './helpers.mjs';
import { hashBytes, hashFile } from '../../tools/validate-rulesets.mjs';

after(cleanup);

const revisionsPath = root => path.join(root, 'rulesets', 'REVISIONS.md');
// N is the last revision of the real repository; a copy gets the next one, whatever N is.
const N = lastRevision();
const NEXT = N + 1;
const addHeading2 = (root, n = NEXT) => fs.appendFileSync(revisionsPath(root), `\n## Revision ${n} — trial\n\nText of the entry.\n`);
// one «ok» line per game file and per texts file, counted from the folders (the open tree has no texts folder)
const expectedOk = () => fs.readdirSync(path.join(REPO, 'rulesets')).filter(f => f.endsWith('.json')).length
	+ (fs.existsSync(path.join(REPO, 'rulesets', 'texts')) ? fs.readdirSync(path.join(REPO, 'rulesets', 'texts')).filter(f => f.endsWith('.json')).length : 0);
const keyOf = name => JSON.parse(fs.readFileSync(path.join(REPO, 'rulesets', name + '.json'), 'utf8')).revision;

test('the real files pass, and the copy too', () => {
	const root = copyRulesets();
	const r = validate(root);
	assert.equal(r.code, 0, r.out);
	assert.equal((r.out.match(/^ok /gm) || []).length, expectedOk());
});

test('hashBytes turns CRLF into LF', () => {
	assert.equal(hashBytes(Buffer.from('a\r\nb\r\n')), hashBytes(Buffer.from('a\nb\n')));
	assert.notEqual(hashBytes(Buffer.from('a\nb')), hashBytes(Buffer.from('a\nc')));
	assert.equal(hashBytes(Buffer.from('')), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('G6: one changed byte fails and names the file', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'baronetti');
	fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/\n$/, ' \n'));
	const r = validate(root);
	assert.equal(r.code, 1);
	assert.match(r.out, /FAIL rulesets[\\/]baronetti\.json/);
	assert.match(r.out, new RegExp(`changed since revision ${N}`));
	assert.doesNotMatch(r.out, /FAIL rulesets[\\/]morto\.json/);
});

test('G6: a CRLF copy of an unchanged file passes', () => {
	const root = copyRulesets();
	for (const n of ['baronetti', 'morto', 'sedici_3']) {
		const f = gameFile(root, n);
		fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/\r?\n/g, '\r\n'));
	}
	const r = validate(root);
	assert.equal(r.code, 0, r.out);
	assert.equal(hashFile(gameFile(root, 'morto')), hashFile(path.join(REPO, 'rulesets', 'morto.json')));
});

test('G6: a new game file without a new block fails', () => {
	const root = copyRulesets();
	fs.copyFileSync(gameFile(root, 'morto'), gameFile(root, 'morto_copy'));
	mutate(gameFile(root, 'morto_copy'), g => { g.id = 'morto_copy'; });
	const r = validate(root);
	assert.equal(r.code, 1);
	assert.match(r.out, new RegExp(`not in the block r${N}`));
});

test('G6: --stamp of the next revision passes, and never edits a game file', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'baronetti');
	mutate(f, g => { g.revision = NEXT; g.about += ' (revised)'; });
	const before = hashFile(f);
	addHeading2(root);
	const s = validate(root, '--stamp', String(NEXT));
	assert.equal(s.code, 0, s.out);
	assert.equal(hashFile(f), before);
	const r = validate(root);
	assert.equal(r.code, 0, r.out);
	assert.match(fs.readFileSync(revisionsPath(root), 'utf8'), /<!-- files r2\nbagattultimo\.json sha256:/);
});

test('G6: a wrong "revision" key fails', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'baronetti');
	mutate(f, g => { g.about += ' (revised)'; }); // content changed, the key stays as it was
	addHeading2(root);
	assert.equal(validate(root, '--stamp', String(NEXT)).code, 0);
	const r = validate(root);
	assert.equal(r.code, 1);
	assert.match(r.out, /FAIL rulesets[\\/]baronetti\.json/);
	assert.match(r.out, new RegExp(`"revision" is ${keyOf('baronetti')}, but the file last changed in revision ${NEXT}`));
	// an untouched file keeps its key and passes
	assert.match(r.out, /ok +rulesets[\\/]morto\.json/);
	// and a file claiming the new revision although it did not change
	mutate(gameFile(root, 'morto'), g => { g.revision = NEXT; });
	const r2 = validate(root);
	assert.match(r2.out, /FAIL rulesets[\\/]morto\.json/);
});

test('G6: --stamp refuses without the heading, and a wrong number', () => {
	const root = copyRulesets();
	const no = validate(root, '--stamp', String(NEXT));
	assert.equal(no.code, 1);
	assert.match(no.out, /no heading/);
	addHeading2(root);
	const skip = validate(root, '--stamp', String(NEXT + 1));
	assert.equal(skip.code, 1);
	assert.match(skip.out, /no heading/);
	addHeading2(root, NEXT + 1);
	const skip3 = validate(root, '--stamp', String(NEXT + 1));
	assert.equal(skip3.code, 1);
	assert.match(skip3.out, new RegExp(`next revision is ${NEXT}`));
	const again = validate(root, '--stamp', String(N));
	assert.equal(again.code, 1);
	assert.match(again.out, new RegExp(`next revision is ${NEXT}`));
	assert.doesNotMatch(fs.readFileSync(revisionsPath(root), 'utf8'), new RegExp(`files r${NEXT}`));
});

test('G5: a "by" that is not in sources fails; a built-in one passes', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'baronetti');
	mutate(f, g => {
		const [, leaf] = findLeaf(g, n => n.by === 'ours');
		leaf.by = 'nosuch_source';
	});
	const r = validate(root);
	assert.match(r.out, /by: «nosuch_source» is not in «sources»/);
	mutate(f, g => {
		const [, leaf] = findLeaf(g, n => n.by === 'nosuch_source');
		leaf.by = 'torino1787';
	});
	assert.doesNotMatch(validate(root).out, /is not in «sources»/);
});

test('"replace" on a [D] leaf fails; on [S] and [R] it passes', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'morto');
	const repl = { with: ['expert', 'bots'], what: 'a test', q: 6 };
	mutate(f, g => { findLeaf(g, n => mark(n) === 'D')[1].replace = repl; });
	let r = validate(root);
	assert.match(r.out, /\.replace: allowed on \[S\] and \[R\] leaves only/);
	mutate(f, g => {
		delete findLeaf(g, n => n.replace)[1].replace;
		findLeaf(g, n => mark(n) === 'S')[1].replace = repl;
		findLeaf(g, n => mark(n) === 'R')[1].replace = repl;
	});
	r = validate(root);
	assert.doesNotMatch(r.out, /\.replace/);
});

test('"replace": wrong shape or an unknown question fails', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'morto');
	mutate(f, g => { findLeaf(g, n => mark(n) === 'S')[1].replace = { with: ['magic'], what: 'x', q: 6 }; });
	assert.match(validate(root).out, /replace/);
	mutate(f, g => { findLeaf(g, n => n.replace)[1].replace = { with: ['bots'], what: 'x', q: 999 }; });
	assert.match(validate(root).out, /no question 999/);
});

test('point 48: deal.piles are summed per seat', () => {
	const root = copyRulesets();
	const f = gameFile(root, 'baronetti');
	const ok = validate(root);
	assert.match(ok.out, /ok +rulesets[\\/]baronetti\.json/);
	mutate(f, g => {
		const deal = g.hand.phases.find(p => p.module === 'deal');
		deal.settings.piles.value = [10, 10, 10, 8];
	});
	const r = validate(root);
	assert.match(r.out, /2 seats: dead «none» but 2 cards are left/);
	mutate(f, g => {
		const deal = g.hand.phases.find(p => p.module === 'deal');
		deal.settings.piles.value = [10, 10, 10, 10];
	});
	assert.match(validate(root).out, /needs 80 cards, the deck has 78/);
});
