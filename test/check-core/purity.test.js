// Independent check of the core: purity (no game id, no I/O, no clock, no Math.random in core/ and bots/), determinism, clone, replay, the
// hash, the rng and the random robot.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { replayHand, makeRng, canonical, hashOf } from '../../core/index.js';
import { chooseAction } from '../../bots/random.js';
import { ROOT, allIds, load, SIX, newH, playOut } from './lib.mjs';

function sources(dir) {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...sources(p));
		else if (e.name.endsWith('.js') || e.name.endsWith('.mjs')) out.push(p);
	}
	return out;
}
const CODE = [...sources(path.join(ROOT, 'core')), ...sources(path.join(ROOT, 'bots'))];

test('no game id appears in core/ or bots/', () => {
	const ids = allIds();
	assert.ok(ids.length >= 21);
	for (const f of CODE) {
		const txt = fs.readFileSync(f, 'utf8');
		for (const id of ids) assert.ok(!new RegExp(`\\b${id}\\b`).test(txt), `${path.relative(ROOT, f)} names ${id}`);
	}
});

test('core/ and bots/ use no I/O, clock, Math.random, process, eval or dynamic import', () => {
	const bad = [/\bMath\.random\b/, /\bDate\b/, /\bprocess\b/, /\brequire\s*\(/, /from\s+['"]node:/, /from\s+['"](fs|net|http|https|os|path|child_process|worker_threads)['"]/,
		/\bfetch\s*\(/, /\bsetTimeout\b|\bsetInterval\b/, /\beval\s*\(/, /new\s+Function\b/, /\bimport\s*\(/, /\bperformance\b/, /\bcrypto\b/];
	for (const f of CODE) {
		const txt = fs.readFileSync(f, 'utf8').replace(/^\s*\/\/.*$/gm, '');
		for (const re of bad) assert.ok(!re.test(txt), `${path.relative(ROOT, f)} matches ${re}`);
		for (const m of txt.matchAll(/from\s+['"]([^'"]+)['"]/g)) assert.ok(m[1].startsWith('.'), `${path.relative(ROOT, f)} imports ${m[1]}`);
	}
});

test('the same seed gives the same hand twice; replay gives the same checksum; clone() is independent', () => {
	for (const [id, n] of SIX) {
		const g = load(id, n);
		for (let i = 0; i < 6; i++) {
			const a = playOut(newH(g, `det-${id}-${i}`, i % n), { seed: 'd' + i });
			const b = playOut(newH(g, `det-${id}-${i}`, i % n), { seed: 'd' + i });
			assert.equal(a.checksum(), b.checksum());
			assert.deepEqual(a.log, b.log);
			const r = replayHand(g, { seed: `det-${id}-${i}`, dealer: i % n }, a.log);
			assert.equal(r.checksum(), a.checksum());
			assert.deepEqual(r.result(), a.result());
		}
		// clone in the middle of a hand
		const h = newH(g, 'cl-' + id, 0);
		for (let k = 0; k < 7 && !h.isOver(); k++) { const s = h.toAct()[0]; h.apply(s, h.legal(s)[h.legal(s).length - 1]); }
		const sum = h.checksum();
		const c = h.clone();
		assert.equal(c.checksum(), sum);
		playOut(c, { seed: 'clone' });
		assert.equal(h.checksum(), sum, id + ': playing the clone changed the original');
		assert.ok(!h.isOver());
		c.s.hands[0].push('X');
		assert.ok(!h.s.hands[0].includes('X'));
	}
});

test('replayHand throws on a refused action', () => {
	const g = load('venticinque', 2);
	assert.throws(() => replayHand(g, { seed: 'x', dealer: 0 }, [{ seat: 1, action: { type: 'play', card: 'T1' } }]));
});

test('refusals: not to act, over, bad action, illegal, next; a refused action changes nothing', () => {
	const g = load('venticinque', 2);
	const h = newH(g, 'ref', 0);
	const sum = h.checksum();
	for (const [seat, a] of [[1, { type: 'discard', card: h.s.hands[1][0] }], [0, null], [0, { type: 'next' }], [0, { type: 'play', card: h.s.hands[0][0] }], [0, { type: 'discard', card: 'T99' }], [7, { type: 'discard' }], ['0', { type: 'discard', card: h.s.hands[0][5] }]]) {
		const r = h.apply(seat, a);
		assert.equal(r.ok, false, JSON.stringify(a));
		assert.equal(typeof r.code, 'string');
	}
	assert.equal(h.checksum(), sum);
	playOut(h, { seed: 'ref' });
	assert.equal(h.apply(0, { type: 'play', card: 'T1' }).code, 'over');
	assert.deepEqual(h.legal(0), []);
	assert.deepEqual(h.toAct(), []);
});

// the reference FNV-1a 64 over the UTF-8 bytes
function fnvRef(str) {
	let h = 0xcbf29ce484222325n;
	for (const b of Buffer.from(str, 'utf8')) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
	return h.toString(16).padStart(16, '0');
}

test('checksum() is FNV-1a 64 of the canonical JSON of the snapshot (sorted keys)', () => {
	const h = playOut(newH(load('morto', 2), 'hash', 0), { seed: 'h' });
	assert.equal(h.checksum(), fnvRef(canonical(h.snapshot())));
	assert.match(h.checksum(), /^[0-9a-f]{16}$/);
	assert.equal(canonical({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
});

// BUG (small): non-ASCII text is not hashed as FNV-1a over UTF-8 bytes (a seed or option text with «é» or a Cyrillic letter)
test('hashOf of non-ASCII text equals FNV-1a 64 over its UTF-8 bytes', () => {
	for (const s of ['é', '\u0436', 'seed «a»']) assert.equal(hashOf(s), fnvRef(JSON.stringify(s)), s);
});

test('makeRng: same seed same stream; int(n) in range; the shuffle used by the deal is checked in deal.test.js', () => {
	const a = makeRng('s'), b = makeRng('s'), c = makeRng('t');
	const xa = Array.from({ length: 50 }, () => a.next());
	assert.deepEqual(xa, Array.from({ length: 50 }, () => b.next()));
	assert.notDeepEqual(xa, Array.from({ length: 50 }, () => c.next()));
	for (const x of xa) assert.ok(x >= 0 && x < 1);
	const r = makeRng('i');
	for (let i = 0; i < 1000; i++) { const k = r.int(7); assert.ok(Number.isInteger(k) && k >= 0 && k < 7); }
});

test('the random robot: uniform over the legal actions, a monte proposed with probability 0.05', () => {
	const rng = makeRng('bot');
	const acts = [{ type: 'a_monte_propose' }, { type: 'a_monte_pass' }];
	let prop = 0;
	const N = 40000;
	for (let i = 0; i < N; i++) if (chooseAction(acts, rng).type === 'a_monte_propose') prop++;
	assert.ok(Math.abs(prop / N - 0.05) < 0.006, 'propose rate ' + prop / N);
	const plays = ['a', 'b', 'c', 'd'].map((card) => ({ type: 'play', card }));
	const cnt = { a: 0, b: 0, c: 0, d: 0 };
	for (let i = 0; i < N; i++) cnt[chooseAction(plays, rng).card]++;
	for (const k of Object.keys(cnt)) assert.ok(Math.abs(cnt[k] / N - 0.25) < 0.01, k);
	assert.equal(chooseAction([], rng), null);
});
