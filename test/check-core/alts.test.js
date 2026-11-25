// Independent check of the core: opts.alts. The alt of a leaf is played in place of its value and nothing else changes; a path whose leaf has no
// alt is refused; Support.alts tells the truth.
import test from 'node:test';
import assert from 'node:assert/strict';
import { allIds, getFile, load, newH, playOut, deal } from './lib.mjs';

function seatsOf(id) {
	let f = getFile(id);
	while (f.seats === undefined || f.seats.count === undefined) f = getFile(f.extends);
	const v = f.seats.count.value;
	return Array.isArray(v) ? v[0] : v;
}

// every rule leaf that carries an alt, in the validator's notation; variants are patches, not leaves of the file
function altLeaves(node, at, out) {
	if (Array.isArray(node)) return out;
	if (!node || typeof node !== 'object') return out;
	if ('value' in node && 'alt' in node) { out.push(at); return out; }
	for (const [k, v] of Object.entries(node)) {
		if (k === 'variants' || k === 'value' || k === 'source') continue;
		if (k === 'phases' && Array.isArray(v)) { for (const p of v) altLeaves(p, `${at}.phases[${p.id}]`, out); continue; }
		altLeaves(v, at ? `${at}.${k}` : k, out);
	}
	return out;
}

// the merged rules without the leaf at `path`
function drop(rules, path) {
	const r = JSON.parse(JSON.stringify(rules));
	let node = r;
	const toks = path.split('.');
	toks.forEach((tok, i) => {
		const m = /^(\w+)(?:\[([^\]]+)\])?$/.exec(tok);
		let next = node[m[1]];
		if (m[2] !== undefined) next = next.find((p) => p.id === m[2]);
		if (i === toks.length - 1) { if (m[2] === undefined) delete node[m[1]]; } else node = next;
	});
	return r;
}
function leafAt(rules, path) {
	let node = rules;
	for (const tok of path.split('.')) {
		const m = /^(\w+)(?:\[([^\]]+)\])?$/.exec(tok);
		node = node[m[1]];
		if (m[2] !== undefined) node = node.find((p) => p.id === m[2]);
	}
	return node;
}

test('Support.alts lists every leaf of the merged file that carries an alt (all 21 files)', () => {
	const bad = [];
	for (const id of allIds()) {
		const g = load(id, seatsOf(id));
		const want = altLeaves(g.rules, '', []).sort();
		const got = g.support.alts.map((a) => a.path).sort();
		if (JSON.stringify(want) !== JSON.stringify(got)) bad.push(`${id}: file ${JSON.stringify(want)} support ${JSON.stringify(got)}`);
	}
	assert.deepEqual(bad, []);
});

test('each alt of a runnable game: runnable iff Support says supported; the leaf takes the alt value; no other rule changes', () => {
	for (const id of ['venticinque', 'morto', 'venticinque_3', 'partita_3', 'partita_4', 'meno', 'consiglio', 'dottore']) {
		const n = seatsOf(id);
		const base = load(id, n);
		for (const a of base.support.alts) {
			const g = load(id, n, { alts: [a.path] });
			assert.deepEqual(g.alts, [a.path]);
			assert.equal(g.support.runnable, a.supported, `${id} ${a.path}`);
			assert.deepEqual(leafAt(g.rules, a.path).value, a.alt, `${id} ${a.path}: the alt is not in place`);
			assert.deepEqual(drop(g.rules, a.path), drop(base.rules, a.path), `${id} ${a.path}: other rules changed`);
		}
	}
});

test('a path whose leaf has no alt, or no such path, is refused', () => {
	for (const p of ['hand.phases[count].settings.group', 'seats.count', 'cards.trump_order', 'cards.nothing', 'hand.phases[nope].settings.x', 'hand.phases[discard]', 'nonsense..path']) {
		assert.throws(() => load('partita_4', 4, { alts: [p] }), undefined, p);
	}
});

// play two hands from one seed and preset, with and without the alt, choosing the same action whenever it is legal
// in both; return the step where they part
function twin(gA, gB, init, choose) {
	const a = newH(gA, init.seed, init.dealer, { preset: init.preset });
	const b = newH(gB, init.seed, init.dealer, { preset: init.preset });
	assert.equal(a.checksum(), b.checksum(), 'the deal differs');
	let step = 0;
	while (!a.isOver() && !b.isOver()) {
		const sa = a.toAct()[0], sb = b.toAct()[0];
		if (sa !== sb) return { a, b, step, why: 'toAct' };
		const la = a.legal(sa), lb = b.legal(sb);
		const both = la.filter((x) => lb.some((y) => y.type === x.type && y.card === x.card));
		if (both.length !== la.length || both.length !== lb.length) {
			if (!both.length) return { a, b, step, why: 'legal', la, lb };
			if (!choose) return { a, b, step, why: 'legal', la, lb };
		}
		const act = choose ? choose(both, step) : both[0];
		assert.ok(a.apply(sa, act).ok && b.apply(sb, act).ok);
		step++;
	}
	return { a, b, step, why: 'end' };
}

test('partita_4 discard_honours_barred alt: the discard differs only by the Angel and the Fool; the same play ends the same', () => {
	const gA = load('partita_4', 4);
	const gB = load('partita_4', 4, { alts: ['hand.phases[discard].settings.discard_honours_barred'] });
	const preset = deal([21, 19, 19, 19], [['T20', 'T0', 'T1', 'swords:K']]);
	const first = twin(gA, gB, { seed: 'x', dealer: 0, preset });
	assert.equal(first.why, 'legal');
	assert.equal(first.step, 0);
	const extra = first.lb.filter((y) => !first.la.some((x) => x.card === y.card)).map((x) => x.card).sort();
	assert.deepEqual(extra, ['T0', 'T20']);
	// same discards (cards legal in both), then the rest of the hand must be identical
	const done = twin(gA, gB, { seed: 'x', dealer: 0, preset }, (both) => both[0]);
	assert.equal(done.why, 'end');
	assert.equal(done.a.checksum(), done.b.checksum());
	assert.deepEqual(done.a.result(), done.b.result());
});

test('partita_4 fool_exchange alt false: the same play gives the same tricks; only the Fool\'s card moves or not', () => {
	const gA = load('partita_4', 4);
	const gB = load('partita_4', 4, { alts: ['cards.fool_exchange'] });
	let seen = 0;
	for (let i = 0; i < 40 && seen < 5; i++) {
		const r = twin(gA, gB, { seed: 'fx' + i, dealer: i % 4 }, (both) => both[both.length - 1]);
		assert.ok(r.b.isOver());
		if (!r.a.isOver()) {
			const s = r.a.toAct()[0];
			assert.equal(r.a.legal(s)[0].type, 'fool_give');
			r.a.apply(s, r.a.legal(s)[0]);
		}
		const sa = r.a.snapshot(), sb = r.b.snapshot();
		assert.deepEqual(sa.tricks, sb.tricks);
		if (!sa.foolGive || !sa.foolGive.card) continue;
		seen++;
		assert.equal(sb.foolGive, null);
		const moved = sa.foolGive.card;
		for (let q = 0; q < 4; q++) {
			const wa = sa.won[q].filter((c) => c !== moved).sort();
			const wb = sb.won[q].filter((c) => c !== moved).sort();
			assert.deepEqual(wa, wb);
		}
		assert.ok(sb.won[sa.foolGive.from].concat(sb.won[(sa.foolGive.from + 2) % 4]).includes(moved));
	}
	assert.ok(seen > 0);
});

test('partita_4 allowed_exceptions alt []: the Bagatto without the Fool is barred too', () => {
	const g = load('partita_4', 4, { alts: ['hand.phases[discard].settings.allowed_exceptions'] });
	const h = newH(g, 'x', 0, { preset: deal([21, 19, 19, 19], [['T1']]) });
	assert.ok(!h.s.hands[0].includes('T0'));
	assert.ok(!h.legal(0).some((a) => a.card === 'T1'));
	const base = newH(load('partita_4', 4), 'x', 0, { preset: deal([21, 19, 19, 19], [['T1']]) });
	assert.ok(base.legal(0).some((a) => a.card === 'T1'));
});

// revision 9: Partita has no lone player (p. 89) and its first_leader alt «declarer» is gone; Permesso keeps an alt the core does not play
test('permesso_3 first_leader alt «declarer» is reported unsupported and is not runnable', () => {
	const base = load('permesso_3', 3);
	const a = base.support.alts.find((x) => x.path === 'hand.phases[tricks].settings.first_leader');
	assert.equal(a.supported, false);
	const g = load('permesso_3', 3, { alts: [a.path] });
	assert.equal(g.support.runnable, false);
	assert.throws(() => newH(g, 'x', 0));
	playOut(newH(base, 'ok', 0));
});
