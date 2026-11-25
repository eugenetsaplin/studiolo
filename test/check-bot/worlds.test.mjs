// Bot check: the world rebuild. For 300 positions per pair the rebuilt world's view for the seat equals the real view
// in every field (the match envelope aside: a world is a bare hand). Also: hands made by a match (a later hand,
// where the first leader comes from the previous hand), hands after an a monte redeal, and what `forget` does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand, newMatch, makeRng } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { chooseAction as randomAction } from '../../bots/random.js';
import { prepare, sampleWorld } from '../../bots/worlds.js';
import { PAIRS, game, level, tiny, isLegal } from './lib.mjs';

const card = (v) => v.legal.length > 1 && (v.legal[0].type === 'play' || v.legal[0].type === 'discard');
const strip = (v) => { const o = { ...v }; delete o.match; return o; };

// positions of real play (the random robot, deal-throw proposals included, so some hands are redealt)
function realPositions(g, tag, want, fromMatch = false) {
	const out = [];
	for (let d = 0; out.length < want && d < 400; d++) {
		const rng = makeRng(`${tag}:${d}`);
		let h;
		if (fromMatch) {
			const m = newMatch(g, { seed: `${tag}:${d}`, firstDealer: d % g.seats });
			while (!m.hand.isOver()) { const q = m.hand.toAct()[0]; m.hand.apply(q, randomAction(m.hand.legal(q), rng)); }
			if (m.isOver()) continue;
			m.next();
			h = m.hand;
		} else h = newHand(g, { seed: `${tag}:${d}`, dealer: d % g.seats });
		let k = 0;
		while (!h.isOver()) {
			const ta = h.toAct();
			if (ta.length === 1 && k % 3 === d % 3) {
				const v = h.view(ta[0]);
				if (card(v)) out.push({ view: v, me: ta[0], redealt: h.snapshot().redeals > 0 });
			}
			const q = ta[0];
			h.apply(q, randomAction(h.legal(q), rng));
			k++;
		}
	}
	return out.slice(0, want);
}

test('300 positions per pair: the rebuilt world shows the seat exactly its real view', () => {
	const lv = level('normal');
	const report = [];
	for (const [id, n] of PAIRS) {
		const g = game(id, n);
		const ps = realPositions(g, `w300:${id}:${n}`, 300);
		assert.equal(ps.length, 300);
		let built = 0;
		let fallback = 0;
		for (const [i, p] of ps.entries()) {
			const info = prepare(g, p.view);
			assert.ok(info.ok, `${id}:${n} #${i}: prepare refused a real view: ${info.why}`);
			let w = null;
			for (let k = 0; k < 3 && !w; k++) w = sampleWorld(g, p.view, info, lv, makeRng, 'w' + i, k);
			if (!w) { fallback++; continue; }
			built++;
			assert.deepEqual(strip(w.hand.view(p.me)), strip(p.view), `${id}:${n} #${i}: the world's view differs from the real one`);
			// the world is a full deck
			const s = w.hand.snapshot();
			const cards = [...Object.values(s.hands).flat(), ...Object.values(s.discard).flat(), ...Object.values(s.won).flat(), ...s.rest, ...s.stock, ...s.trick.map((t) => t.card)];
			assert.equal(new Set(cards).size, 78);
		}
		report.push(`${id}:${n} ${built}/300`);
		assert.ok(fallback <= 3, `${id}:${n}: ${fallback} of 300 positions built no world in 3 tries`);
	}
	console.log('worlds built: ' + report.join(', '));
});

test('a later hand of a match (the first leader carried over): worlds match the view, answers legal', () => {
	for (const [id, n] of [['dottore', 5], ['consiglio', 4], ['meno', 4], ['partita_3', 3]]) {
		const g = game(id, n);
		const ps = realPositions(g, `wm:${id}`, 60, true);
		assert.ok(ps.length >= 30, id + ': too few match positions ' + ps.length);
		let built = 0;
		for (const [i, p] of ps.entries()) {
			assert.ok(p.view.match && p.view.match.handIndex >= 1);
			const info = prepare(g, p.view);
			assert.ok(info.ok);
			const w = sampleWorld(g, p.view, info, level('normal'), makeRng, 'm' + i, 0);
			if (w) { built++; assert.deepEqual(strip(w.hand.view(p.me)), strip(p.view), `${id}:${n} match #${i}`); }
			if (i % 6 === 0) assert.ok(isLegal(p.view, chooseAction({ game: g, view: p.view, level: level('easy'), seed: 'm' + i }).action));
		}
		assert.ok(built >= ps.length - 2, `${id}: ${built}/${ps.length} built`);
	}
});

test('hands after an a monte redeal rebuild too', () => {
	const g = game('venticinque_3', 3);
	const ps = realPositions(g, 'wr', 900).filter((p) => p.redealt);
	assert.ok(ps.length > 0, 'no redealt hand in the sample');
	for (const [i, p] of ps.entries()) {
		const info = prepare(g, p.view);
		assert.ok(info.ok);
		const w = sampleWorld(g, p.view, info, level('normal'), makeRng, 'r' + i, 0);
		if (w) assert.deepEqual(strip(w.hand.view(p.me)), strip(p.view));
	}
});

// Contract §6: forget = "chance to ignore each inferred void when sampling". A built world can never contain an ignored
// void (the core refuses the old off-suit play), so forget only costs worlds. The first draft of this test asked for
// ignored voids in built worlds, which no consistent world can have; it is corrected to what can be true: no built
// world breaks a void, and forget 1 loses at least as many worlds as forget 0.
test('forget: no void broken in a built world; it only costs worlds', () => {
	const g = game('meno', 4);
	const ps = realPositions(g, 'fg', 300).filter((p) => p.view.tricks.length >= 4 && p.view.legal[0].type === 'play');
	let fail0 = 0;
	let fail1 = 0;
	let ignored = 0;
	for (const [i, p] of ps.entries()) {
		const info = prepare(g, p.view);
		if (!sampleWorld(g, p.view, info, tiny({ forget: 0 }), makeRng, 'f' + i, 0)) fail0++;
		const w = sampleWorld(g, p.view, info, tiny({ forget: 1 }), makeRng, 'f' + i, 0);
		if (!w) { fail1++; continue; }
		const s = w.hand.snapshot();
		for (const v of info.voids) if (s.hands[v.seat].some((c) => c !== 'T0' && (v.cat === 'trump' ? /^T/.test(c) : c.startsWith(v.cat + ':')))) ignored++;
	}
	assert.equal(ignored, 0);
	assert.ok(fail1 >= fail0, `forget 1 lost ${fail1}, forget 0 lost ${fail0} of ${ps.length}`);
});
