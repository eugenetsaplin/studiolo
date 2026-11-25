// Robots through the core: random hands, whole matches, every check after every action, the census of rare cases.
// Usage: node tools/robots.mjs --games <id[:seats],...|runnable> --deals N --seed S [--secrecy M] [--alts N]
//        [--workers K] [--out file] [--census-out file] [--false-claims P]
// --false-claims P: with chance P the random robot claims «fuora» although it is not out (to exercise the payment); off by default.
// The secrecy check also demands that covered pile cards (own too) and the order of the undealt cards change nothing a seat sees.
// Reads core/ and bots/random.js, never edits them. The checks come from test/lib/.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { loadGame, newHand, newMatch, replayHand, makeRng, DECK, sortCards } from '../core/index.js';
import { compileSelector } from '../core/selectors.js';
import { chooseAction } from '../bots/random.js';
import { conservation, recount } from '../test/lib/invariants.mjs';
import { leaks, idsIn } from '../test/lib/secrecy.mjs';
import { WORK } from './workdir.mjs';

export { WORK };
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
const RULESETS = path.join(ROOT, 'rulesets');

// ---------- game files ----------
const cache = new Map();
export function getFile(id) {
	if (!cache.has(id)) cache.set(id, JSON.parse(fs.readFileSync(path.join(RULESETS, id + '.json'), 'utf8')));
	return structuredClone(cache.get(id));
}
export const gameIds = () => fs.readdirSync(RULESETS).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();

// the seat counts a file allows: its own seats.count, else the one of its parent
export function seatCounts(id) {
	for (let f = getFile(id); f; f = f.extends ? getFile(f.extends) : null) {
		const v = f.seats && f.seats.count && f.seats.count.value;
		if (v !== undefined) return [].concat(v);
	}
	return [];
}

// ---------- the cases ----------
// All cases of the files: {id, seats, game (default options and variant), support}; a load error is kept as `error`.
export function allCases() {
	const out = [];
	for (const id of gameIds()) {
		for (const seats of seatCounts(id)) {
			try {
				const game = loadGame(id, getFile, { seats });
				out.push({ id, seats, support: game.support });
			} catch (e) { out.push({ id, seats, error: e.message }); }
		}
	}
	return out;
}
export const runnableCases = () => allCases().filter((c) => c.support && c.support.runnable);

// ---------- small helpers ----------
const sum = (a) => a.reduce((x, y) => x + y, 0);
const jstr = JSON.stringify;
function choose(n, k) { // exact, BigInt
	if (k < 0 || k > n) return 0n;
	let r = 1n;
	for (let i = 1n; i <= BigInt(k); i++) r = (r * (BigInt(n) - BigInt(k) + i)) / i;
	return r;
}
// P(at most `max` of the `special` cards in a hand of `h` cards from a deck of `total`)
export function hyperAtMost(total, special, h, max) {
	let num = 0n;
	for (let k = 0; k <= max; k++) num += choose(special, k) * choose(total - special, h - k);
	const den = choose(total, h);
	return Number((num * 10n ** 12n) / den) / 1e12;
}

// ---------- the independent recount of a finished hand ----------
// Written from the format (GAME_FILE_FORMAT 11.12) and CORE_API 7: who keeps the discard, how the units (seats or pooled sides) are counted.
function keeperOf(rule, forfeit, nDiscards, discarder, dealer, tricks, sidesOf) {
	let r = rule || 'discarder';
	if (forfeit !== undefined && nDiscards <= 1) r = forfeit ? 'discarder_unless_no_tricks' : 'discarder';
	if (r === 'nobody') return null;
	if (r === 'dealer') return dealer;
	if (r === 'discarder_unless_no_tricks') {
		if (tricks.length === 0 || tricks.some((t) => sidesOf[t.winner] === sidesOf[discarder])) return discarder;
		return tricks[tricks.length - 1].winner;
	}
	return discarder;
}

export function recountHand(game, snap, result, sidesOf) {
	const problems = [];
	const countSet = game.plan.find((e) => e.module === 'count').set;
	const discSet = (game.plan.find((e) => e.module === 'discard') || {}).set || {};
	const n = game.seats;
	const pool = game.cfg.sides.pool === 'side';
	const discarders = [];
	for (let q = 0; q < n; q++) if ((snap.discard[q] || []).length) discarders.push(q);
	const kept = {};
	for (const q of discarders) {
		const k = keeperOf(discSet.counts_for, countSet.dealer_forfeit, discarders.length, q, snap.dealer, snap.tricks, sidesOf);
		if (k !== null) (kept[k] = kept[k] || []).push(...snap.discard[q]);
	}
	const units = [];
	if (pool) { const seen = new Set(); for (let q = 0; q < n; q++) if (!seen.has(sidesOf[q])) { seen.add(sidesOf[q]); units.push([...Array(n).keys()].filter((x) => sidesOf[x] === sidesOf[q])); } }
	else for (let q = 0; q < n; q++) units.push([q]);
	const cardsOf = {};
	units.forEach((seats, i) => { cardsOf[i] = [...seats.flatMap((q) => snap.won[q]), ...seats.flatMap((q) => kept[q] || [])]; });
	const opts = { cardPoints: game.cfg.cards.card_points, group: countSet.group || 2, oddCard: countSet.odd_card || 'half_point', plainValue: countSet.plain_value === undefined ? 1 : countSet.plain_value };
	const mine = recount(cardsOf, opts);
	const sideTotal = {};
	units.forEach((seats, i) => {
		for (const q of seats) if (result.points[q] !== mine[i]) problems.push(`points[${q}]: core ${result.points[q]}, recount ${mine[i]}`);
		for (const q of seats) { const b = result.breakdown && result.breakdown[q]; if (b && b.won + b.discard + b.fool + b.stock !== result.points[q]) problems.push(`breakdown[${q}] does not add up`); }
		for (const q of seats) sideTotal[sidesOf[q]] = (sideTotal[sidesOf[q]] || 0) + (pool ? 0 : mine[i]);
		if (pool) sideTotal[sidesOf[seats[0]]] = mine[i];
	});
	for (const [sd, v] of Object.entries(sideTotal)) if (result.sidePoints[sd] !== v) problems.push(`sidePoints[${sd}]: core ${result.sidePoints[sd]}, recount ${v}`);
	return problems;
}

// ---------- the census ----------
export const CENSUS_KEYS = [
	'hands', 'seat_no_trick', 'dealer_no_trick', 'discarder_no_trick', 'fool_played', 'fool_owner_no_plain_seat',
	'fool_owner_no_other_seat', 'fool_owner_no_plain_side', 'fool_owner_no_other_side', 'fool_led', 'tied',
	'dealer_few_trumps', 'discarder_all_barred', 'discard_all_barred_midway', 'a_monte_agreed',
];
const newCensus = () => Object.fromEntries(CENSUS_KEYS.map((k) => [k, 0]));

function barredPredicate(game) {
	const e = game.plan.find((x) => x.module === 'discard');
	if (!e) return null;
	const set = e.set;
	const parts = [];
	if (set.discard_honours_barred !== false) {
		if (game.cfg.cards.sets && game.cfg.cards.sets.honours) parts.push(compileSelector('set:honours', game.env));
		else { const v = game.tables.values.v; parts.push((c) => v[c] >= 5); }
	}
	for (const b of set.barred || []) parts.push(compileSelector(b, game.env));
	const exc = (set.allowed_exceptions || []).map((x) => compileSelector(x, game.env));
	return (c, hand) => parts.some((p) => p(c, { hand })) && !exc.some((p) => p(c, { hand }));
}

// how many cards of the deck the discard bars at most (the allowed exceptions ignored): a discarder whose hand is longer can never hold only barred cards
function barredCount(game) {
	const set = game.plan.find((x) => x.module === 'discard').set;
	const parts = [];
	if (set.discard_honours_barred !== false) {
		if (game.cfg.cards.sets && game.cfg.cards.sets.honours) parts.push(compileSelector('set:honours', game.env));
		else { const v = game.tables.values.v; parts.push((c) => v[c] >= 5); }
	}
	for (const b of set.barred || []) parts.push(compileSelector(b, game.env));
	return DECK.filter((c) => parts.some((p) => p(c, { hand: [] }))).length;
}

function censusHand(game, cen, cap, snap, result, sidesOf) {
	const n = game.seats;
	const won = new Array(n).fill(0);
	for (const t of snap.tricks) won[t.winner]++;
	cen.hands++;
	if (won.some((x) => x === 0)) cen.seat_no_trick++;
	if (won[snap.dealer] === 0) cen.dealer_no_trick++;
	if (cap.discarders.length && cap.discarders.some((q) => won[q] === 0)) cen.discarder_no_trick++;
	const foolTrick = snap.tricks.find((t) => t.fool !== null);
	if (foolTrick) {
		cen.fool_played++;
		const owner = foolTrick.fool;
		const v = game.tables.values.v;
		const ownWon = (q) => [...snap.tricks.filter((t) => t.winner === q).flatMap((t) => t.cards.map((c) => c.card)), ...snap.drawn.filter((d) => d.seat === q).map((d) => d.card)].filter((c) => c !== 'T0');
		const mineOwn = ownWon(owner);
		const side = [...Array(n).keys()].filter((q) => sidesOf[q] === sidesOf[owner]).flatMap(ownWon);
		if (!mineOwn.some((c) => v[c] <= 1)) cen.fool_owner_no_plain_seat++;
		if (!mineOwn.length) cen.fool_owner_no_other_seat++;
		if (!side.some((c) => v[c] <= 1)) cen.fool_owner_no_plain_side++;
		if (!side.length) cen.fool_owner_no_other_side++;
	}
	if (snap.tricks.some((t) => t.cards.length && t.cards[0].card === 'T0')) cen.fool_led++;
	const sp = Object.values(result.sidePoints).sort((a, b) => a - b);
	const low = (game.plan.find((e) => e.module === 'result').set || {}).winner === 'fewest_points';
	if (sp.length >= 2 && (low ? sp[0] === sp[1] : sp[sp.length - 1] === sp[sp.length - 2])) cen.tied++;
	if (cap.dealerTrumps !== null && cap.dealerTrumps <= 3) cen.dealer_few_trumps++;
	if (cap.allBarredStart) cen.discarder_all_barred++;
	if (cap.allBarredMid) cen.discard_all_barred_midway++;
	if (snap.redeals > 0) cen.a_monte_agreed++;
}

// ---------- the illegal action the robot tries now and then ----------
const OTHER_TYPES = ['a_monte_propose', 'a_monte_pass', 'a_monte_agree', 'a_monte_refuse', 'fool_give', 'discard', 'play', 'next', 'pass', 'lay_down', 'lay_done', 'call', 'call_partner', 'declare_done', 'bid_zzz', 'zzz'];
const CARD_TYPES = ['discard', 'play', 'fool_give', 'lay_down', 'call', 'call_partner'];
function illegalTry(toAct, legalOf, rng, n) {
	const seat = toAct[rng.int(toAct.length)];
	const legal = legalOf(seat);
	const fam = rng.int(4);
	if (fam === 0) { // a card that is not among the legal ones of its type
		const withCard = legal.filter((a) => a.card !== undefined);
		if (withCard.length) {
			const type = withCard[rng.int(withCard.length)].type;
			const okCards = new Set(legal.filter((a) => a.type === type).map((a) => a.card));
			const pool = DECK.filter((c) => !okCards.has(c));
			if (pool.length) return { seat, action: { type, card: pool[rng.int(pool.length)] } };
		}
	}
	if (fam === 1 && toAct.length < n) { // the right action by a seat that is not to act
		const other = [...Array(n).keys()].filter((q) => !toAct.includes(q));
		return { seat: other[rng.int(other.length)], action: legal[rng.int(legal.length)] };
	}
	const types = new Set(legal.map((a) => a.type));
	const cand = OTHER_TYPES.filter((t) => !types.has(t));
	const type = cand[rng.int(cand.length)];
	if (CARD_TYPES.includes(type)) return { seat, action: { type, card: DECK[rng.int(DECK.length)] } };
	return { seat, action: { type } };
}

const idsOf = (view) => [...idsIn(view)];

// ---------- piles and the pack: what a view may never show ----------
// every pile card that is not an open top, of every seat (the owner may not look at his covered cards either)
export function coveredCards(snap) {
	const out = [];
	for (const piles of snap.piles || []) for (const p of piles) p.cards.forEach((c, i) => { if (!(p.open && i === p.cards.length - 1)) out.push(c); });
	return out;
}
// the open tops are public: both players see them
function openTops(snap) {
	const out = [];
	for (const piles of snap.piles || []) for (const p of piles) if (p.open && p.cards.length) out.push(p.cards[p.cards.length - 1]);
	return out;
}
// a copy of the hand with the covered pile cards moved to other covered places (all seats pooled) and the pack shuffled;
// whatever a seat sees must be the same in the copy
export function swapSecrets(h, rng) {
	const c = h.clone();
	const s = c.s;
	const slots = [];
	(s.piles || []).forEach((piles, q) => piles.forEach((p) => p.cards.forEach((card, i) => { if (!(p.open && i === p.cards.length - 1)) slots.push({ q, p, i, card }); })));
	const cards = slots.map((x) => x.card);
	for (let i = cards.length - 1; i > 0; i--) { const j = rng.int(i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
	slots.forEach((x, k) => { x.p.cards[x.i] = cards[k]; });
	// each seat's hand holds its pile cards: rebuild it from the piles, plus what the seat holds outside piles
	if (slots.length) {
		for (let q = 0; q < s.n; q++) {
			const inPiles = new Set(h.s.piles[q].flatMap((p) => p.cards));
			const outside = h.s.hands[q].filter((x) => !inPiles.has(x));
			s.hands[q] = [...outside, ...s.piles[q].flatMap((p) => p.cards)];
			s.hands[q].sort();
		}
	}
	for (let i = s.rest.length - 1; i > 0; i--) { const j = rng.int(i + 1); [s.rest[i], s.rest[j]] = [s.rest[j], s.rest[i]]; }
	return c;
}

// The world as another seat may imagine it: between two states with the same view of seat `q` the cards q cannot place
// change places - the hands of the others (the cards the view names stay), the cards the declarer laid down (for
// every seat but the declarer), and the holder of a secret called card (among the seats that could hold it). The
// view of q must stay the same.
export function swapUnseen(h, q, rng) {
	const c = h.clone();
	const s = c.s;
	const named = idsIn(h.view(q));
	const shuffleIn = (list) => { for (let i = list.length - 1; i > 0; i--) { const j = rng.int(i + 1); [list[i], list[j]] = [list[j], list[i]]; } };
	// the holder of a secret card moves first, with a card of the new holder taken in exchange
	if (s.secret && q !== s.secret.holder) {
		const old = s.secret.holder;
		const cands = [...Array(s.n).keys()].filter((r) => r !== q && r !== old && !(q === s.declarer && r === s.declarer));
		const r = cands.length ? cands[rng.int(cands.length)] : -1;
		const give = r >= 0 ? s.hands[r].filter((x) => !named.has(x)) : [];
		if (give.length) {
			const card = s.secret.card;
			const back = give[rng.int(give.length)];
			s.hands[old].splice(s.hands[old].indexOf(card), 1, back);
			s.hands[r].splice(s.hands[r].indexOf(back), 1, card);
			s.secret.holder = r;
			for (const m of Object.values(s.m)) if (m && m.card === card && m.holder === old) m.holder = r;
			if (s.sides) {
				const mine = s.sides.of[s.declarer];
				const other = s.sides.of.find((x) => x !== mine);
				if (old !== s.declarer) s.sides.of[old] = other;
				s.sides.of[r] = mine;
			}
			sortCards(s.hands[old]); sortCards(s.hands[r]);
		}
	}
	// the hands of the others: the unnamed cards are shared out again, each seat keeping its number of cards
	const slots = [];
	for (let r = 0; r < s.n; r++) if (r !== q) s.hands[r].forEach((x, i) => { if (!named.has(x) && !(s.secret && x === s.secret.card)) slots.push({ r, i, card: x }); });
	const cards = slots.map((x) => x.card);
	shuffleIn(cards);
	slots.forEach((x, k) => { s.hands[x.r][x.i] = cards[k]; });
	for (let r = 0; r < s.n; r++) if (r !== q) sortCards(s.hands[r]);
	// the cards laid down by the declarer are not seen by the others: they change places with the declarer's unnamed hand cards
	if (q !== s.declarer && s.declarer !== null) {
		for (const m of Object.values(s.m)) {
			if (!m || !Array.isArray(m.laid) || !m.laid.length || m.stage === 'done') continue;
			const pool = [...m.laid, ...s.hands[s.declarer].filter((x) => !named.has(x))];
			shuffleIn(pool);
			const hand = s.hands[s.declarer].filter((x) => named.has(x));
			m.laid = pool.slice(0, m.laid.length);
			s.hands[s.declarer] = sortCards([...hand, ...pool.slice(m.laid.length)]);
		}
	}
	return c;
}

// what the rules make public in a view, besides the played cards: the cards of the declarations shown open and the
// cards named in a call (and the names it may call); what the seat itself laid, gave and got is its own knowledge
function publicInView(view) {
	const out = [];
	for (const d of (view.declarations && view.declarations.made) || []) for (const x of d.cards || []) out.push(x);
	for (const x of (view.contract && view.contract.called) || []) out.push(x);
	if (view.exchange) {
		for (const x of view.exchange.called || []) out.push(x);
		const mine = view.exchange.mine || {};
		for (const k of ['laid', 'gave', 'got']) for (const x of mine[k] || []) out.push(x);
	}
	if (view.call && view.call.card) out.push(view.call.card);
	// a card the seat may call by name is a name, not knowledge of where the card lies
	for (const x of view.legal || []) if ((x.type === 'call' || x.type === 'call_partner') && x.card) out.push(x.card);
	return out;
}

// the robot's choice: the uniform one of bots/random.js, but «fuora» only when the claimer is out (or, by chance, not)
export function robotAction(h, seat, legal, rng, falseClaims) {
	let pick = legal;
	if (legal.some((a) => a.type === 'claim_fuora')) {
		const v = h.view(seat);
		const target = v.fuora && v.fuora.target;
		const valid = v.points && target !== undefined && v.points.mine >= target;
		const claim = legal.find((a) => a.type === 'claim_fuora');
		if (valid) return claim;
		pick = legal.filter((a) => a.type !== 'claim_fuora');
		if (falseClaims > 0 && rng.next() < falseClaims) return claim;
		if (!pick.length) return claim;
	}
	return chooseAction(biased(pick, rng), rng);
}

// the new actions are rare among the many card choices of the uniform robot: now and then they are offered alone, so
// that auctions are won, laid cards are called and declarations are made in a good share of the hands
export function biased(legal, rng) {
	const declares = legal.filter((a) => a.type.startsWith('declare_') && a.type !== 'declare_done');
	if (declares.length && rng.next() < 0.7) return declares;
	const done = legal.filter((a) => a.type === 'lay_done');
	if (done.length && rng.next() < 0.15) return done;
	const bids = legal.filter((a) => a.type.startsWith('bid_'));
	if (bids.length && rng.next() < 0.7) return bids;
	return legal;
}

// Every card exactly once. The cards the declarer has laid down but not yet given out live in the state of the exchange
// phase, not in a hand: they are not missing.
export function conserved(snap) {
	const laid = new Set();
	for (const m of Object.values(snap.state || {})) if (m && Array.isArray(m.laid)) for (const c of m.laid) laid.add(c);
	return conservation(snap).filter((p) => !(p.endsWith(': missing') && laid.has(p.slice(0, -': missing'.length))));
}

// ---------- one case ----------
export function runCase(spec) {
	const { id, seats, alt = null, deals, seed = 'r1', secrecy = 0, falseClaims = 0 } = spec; // spec.getFile: another way to read the game files (tests)
	const allCheck = spec.allCheck === undefined ? Math.min(secrecy, 50) : spec.allCheck;
	const row = {
		game: id, seats, alt, hands: 0, matches: 0, actions: 0, tried: 0, refusedOk: 0, ms: 0,
		fail: { invariant: 0, recount: 0, secrecy: 0, replay: 0, refusedLegal: 0, illegalAccepted: 0, exception: 0 },
		census: newCensus(), info: { dealerHandSize: null, barredMax: null }, samples: [], error: null,
	};
	let game;
	try { game = loadGame(id, spec.getFile || getFile, { seats, alts: alt ? [alt] : [] }); } catch (e) { row.error = e.message; return row; }
	if (!game.support.runnable) { row.error = 'not runnable: ' + game.support.missing.map((m) => m.path).join(', '); return row; }
	const modOf = Object.fromEntries(game.plan.map((e) => [e.id, e.module]));
	const barred = barredPredicate(game);
	const hasDiscard = !!barred;
	if (hasDiscard) row.info.barredMax = barredCount(game);
	const share = !!game.cfg.sides.partners_share_hands && game.cfg.sides.mode !== 'each_for_self';
	const prize = (game.hooks.tricks || []).find((e) => e.module === 'prize_stock');
	const t0 = performance.now();
	const note = (kind, ctx, detail) => {
		row.fail[kind]++;
		if (row.samples.length < 20) row.samples.push({ kind, game: id, seats, alt, seed: ctx.matchSeed, handIndex: ctx.handIndex, handSeed: ctx.handSeed, detail: String(detail).slice(0, 300) });
	};

	const mkRng = (s) => makeRng(s);
	const playMatch = (matchSeed, maxHands) => {
		const match = newMatch(game, { seed: matchSeed });
		row.matches++;
		let handIndex = 0;
		for (;;) {
			const h = match.hand;
			playHand(h, matchSeed, handIndex, row.hands < secrecy, row.hands < allCheck);
			row.hands++;
			handIndex++;
			let over = false;
			try {
				over = match.isOver();
				const st = match.standing();
				if (over && st.winners === null) note('invariant', { matchSeed, handIndex }, 'a finished match has no winners list');
				if (!over && st.winners !== null) note('invariant', { matchSeed, handIndex }, 'a running match has a winners list');
				if (Object.values(st.ledger).length && sum(Object.values(st.ledger)) !== 0) note('invariant', { matchSeed, handIndex }, 'the ledger does not sum to zero');
			} catch (e) { note('exception', { matchSeed, handIndex }, 'match: ' + e.message); return; }
			if (over || handIndex >= maxHands) return;
			try { match.next(); } catch (e) { note('exception', { matchSeed, handIndex }, 'match.next: ' + e.message); return; }
		}
	};

	const playHand = (h, matchSeed, handIndex, watch, every) => {
		const ctx = { matchSeed, handIndex, handSeed: null };
		const rng = mkRng(`${matchSeed}:bot:${handIndex}`);
		const ill = mkRng(`${matchSeed}:ill:${handIndex}`);
		const cap = { discarders: [], dealerTrumps: null, allBarredStart: false, allBarredMid: false };
		let capStart = false;
		let capDisc = false;
		let snap;
		try {
			snap = h.snapshot();
			ctx.handSeed = snap.seed;
			const dealer = snap.dealer;
			const sidesOf = h.view(0).sides.of;
			const problems = conserved(snap);
			if (problems.length) note('invariant', ctx, 'after the deal: ' + problems[0]);
			let guard = 0;
			const checkViews = () => {
				const played = new Set([...snap.tricks.flatMap((t) => t.cards.map((c) => c.card)), ...snap.trick.map((t) => t.card)]);
				for (let q = 0; q < game.seats; q++) {
					const view = h.view(q);
					const pub = new Set(played);
					for (const d of snap.drawn) if (!prize || (d.seat === q) || (prize.set.show_to === 'all') || (prize.set.show_to !== 'nobody' && sidesOf[q] !== sidesOf[d.seat])) pub.add(d.card);
					if (share) for (let p = 0; p < game.seats; p++) if (sidesOf[p] === sidesOf[q]) snap.hands[p].forEach((c) => pub.add(c));
					for (const c of openTops(snap)) pub.add(c);
					for (const l of Object.values(snap.shown || {})) l.forEach((c) => pub.add(c));
					for (const x of publicInView(view)) pub.add(x);
					const bad = leaks(snap, pub, q, view);
					const covered = new Set(coveredCards(snap));
					if (covered.size) for (const c of idsOf(view)) if (covered.has(c) && !pub.has(c)) bad.push(c);
					const shown = [...view.stock.drawn.map((d) => d.card), ...view.tricks.map((t) => t.prize).filter((c) => c)];
					for (const c of shown) if (!pub.has(c)) bad.push(c);
					if (bad.length) note('secrecy', ctx, `seat ${q} sees ${bad.join(' ')} at action ${snap.log.length}`);
					if (jstr(view.legal) !== jstr(h.legal(q))) note('invariant', ctx, `view.legal differs from legal for seat ${q}`);
					if (!h.toAct().includes(q) && view.legal.length) note('invariant', ctx, `seat ${q} has legal actions out of turn`);
				}
				// covered pile cards and the order of the pack: swapping them must change nothing any seat sees
				const alt2 = swapSecrets(h, mkRng(`${ctx.matchSeed}:swap:${snap.log.length}`));
				for (let q = 0; q < game.seats; q++) if (jstr(h.view(q)) !== jstr(alt2.view(q))) note('secrecy', ctx, `the view of seat ${q} depends on covered cards or on the order of the pack at action ${snap.log.length}`);
				// the hands of the others, the laid cards and the secret partner: another world with the same view of seat q
				for (let q = 0; q < game.seats; q++) {
					const alt3 = swapUnseen(h, q, mkRng(`${ctx.matchSeed}:unseen:${q}:${snap.log.length}`));
					if (jstr(h.view(q)) !== jstr(alt3.view(q))) note('secrecy', ctx, `the view of seat ${q} depends on cards it cannot see (hands of others, laid cards or the secret partner) at action ${snap.log.length}`);
				}
			};
			if (watch) checkViews();
			while (!h.isOver()) {
				if (guard++ > 5000) { note('invariant', ctx, 'the hand does not end'); return; }
				const toAct = h.toAct();
				if (!toAct.length) { note('invariant', ctx, 'nobody to act in a hand that is not over'); return; }
				const mod = modOf[snap.phase];
				if (!capStart && mod !== 'deal' && mod !== 'a_monte') { capStart = true; if (hasDiscard) row.info.dealerHandSize = snap.hands[dealer].length;
					if (hasDiscard) cap.dealerTrumps = snap.hands[dealer].filter((c) => /^T([1-9]|1\d|2[01])$/.test(c)).length; }
				if (mod === 'discard') {
					const q = toAct[0];
					const hand = snap.hands[q];
					const all = hand.length > 0 && hand.every((c) => barred(c, hand));
					if (!capDisc) { capDisc = true; if (all) cap.allBarredStart = true; }
					else if (all) cap.allBarredMid = true;
					if (!cap.discarders.includes(q)) cap.discarders.push(q);
				}
				const legalOf = (q) => h.legal(q);
				if (watch) for (let q = 0; q < game.seats; q++) if (!toAct.includes(q) && legalOf(q).length) note('invariant', ctx, `seat ${q} has legal actions out of turn`);
				if (ill.next() < 0.01) {
					const { seat: s2, action: a2 } = illegalTry(toAct, legalOf, ill, game.seats);
					const before = h.checksum();
					const logLen = h.log.length;
					row.tried++;
					let r;
					try { r = h.apply(s2, a2); } catch (e) { note('exception', ctx, 'an illegal action threw: ' + jstr(a2) + ' ' + e.message); r = null; }
					if (r && r.ok) { note('illegalAccepted', ctx, `accepted ${jstr(a2)} by seat ${s2}`); return; }
					if (r) row.refusedOk++;
					if (h.checksum() !== before || h.log.length !== logLen) { note('invariant', ctx, 'a refused action changed the hand: ' + jstr(a2)); return; }
				}
				const seat = toAct[rng.int(toAct.length)];
				const legal = legalOf(seat);
				if (!legal.length) { note('invariant', ctx, `seat ${seat} is to act and has no legal action`); return; }
				if (every) {
					const c0 = h.checksum();
					for (const a of legal) {
						const cl = h.clone();
						const r = cl.apply(seat, a);
						if (!r.ok) { note('refusedLegal', ctx, `legal ${jstr(a)} refused: ${r.code}`); return; }
					}
					if (h.checksum() !== c0) { note('invariant', ctx, 'trying the legal actions on clones changed the hand'); return; }
				}
				const action = robotAction(h, seat, legal, rng, falseClaims);
				const r = h.apply(seat, action);
				if (!r.ok) { note('refusedLegal', ctx, `chosen ${jstr(action)} refused: ${r.code}`); return; }
				row.actions++;
				snap = h.snapshot();
				const pr = conserved(snap);
				if (pr.length) { note('invariant', ctx, `action ${snap.log.length}: ${pr[0]}`); return; }
				if (watch) checkViews();
			}
			const result = h.result();
			if (!result) { note('invariant', ctx, 'a finished hand has no result'); return; }
			const rc = recountHand(game, snap, result, snap.sides ? snap.sides.of : sidesOf);
			if (rc.length) note('recount', ctx, rc[0]);
			censusHand(game, row.census, cap, snap, result, snap.sides ? snap.sides.of : sidesOf);
			const carry = h.s.carry; // internal: the snapshot does not hold the carry of a match hand
			const rep = replayHand(game, { seed: snap.seed, dealer, carry }, h.log);
			if (rep.checksum() !== h.checksum()) note('replay', ctx, 'the replay has another checksum');
		} catch (e) { note('exception', ctx, e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e.message); }
	};

	// a ledger match without dealer_rounds has no end: one match of `deals` hands; with it whole matches are played one after another
	if (game.cfg.match.kind === 'ledger' && !(game.cfg.match.dealer_rounds >= 1)) playMatch(`${seed}:${id}:${seats}${alt ? ':' + alt : ''}:m0`, deals);
	else {
		for (let k = 0; row.hands < deals; k++) playMatch(`${seed}:${id}:${seats}${alt ? ':' + alt : ''}:m${k}`, Infinity);
	}
	row.ms = performance.now() - t0;
	return row;
}

// ---------- the run: tasks, optional worker threads ----------
export function runTasks(tasks, workers = 1) {
	if (workers <= 1 || tasks.length <= 1) return Promise.resolve(tasks.map(runCase));
	return new Promise((resolve, reject) => {
		const results = new Array(tasks.length);
		let next = 0;
		let done = 0;
		const pool = [];
		const feed = (w) => {
			if (next >= tasks.length) { w.terminate(); return; }
			const i = next++;
			w.once('message', (res) => { results[i] = res; if (++done === tasks.length) { pool.forEach((x) => x.terminate()); resolve(results); } else feed(w); });
			w.postMessage(tasks[i]);
		};
		for (let k = 0; k < Math.min(workers, tasks.length); k++) {
			const w = new Worker(new URL(import.meta.url));
			w.on('error', reject);
			pool.push(w);
			feed(w);
		}
	});
}
if (!isMainThread && parentPort) parentPort.on('message', (task) => parentPort.postMessage(runCase(task)));

// ---------- the report ----------
const pct = (a, b) => (b ? (100 * a / b).toFixed(2) + '%' : '-');
export function formatTable(rows) {
	const head = ['game', 'seats', 'hands', 'actions', 'invariant', 'recount', 'secrecy', 'replay', 'refused-legal', 'illegal tried/refused', 'ms/hand'];
	const lines = [head];
	for (const r of rows) {
		if (r.error) { lines.push([r.game + (r.alt ? ' ' + r.alt : ''), r.seats, 'ERROR', r.error.slice(0, 60)]); continue; }
		const f = r.fail;
		lines.push([r.game + (r.alt ? ' ' + r.alt : ''), r.seats, r.hands, r.actions, f.invariant + f.exception + f.illegalAccepted, f.recount, f.secrecy, f.replay, f.refusedLegal, `${r.tried}/${r.refusedOk}`, (r.ms / Math.max(1, r.hands)).toFixed(2)]);
	}
	const w = head.map((_, i) => Math.max(...lines.map((l) => String(l[i] ?? '').length)));
	return lines.map((l) => l.map((c, i) => String(c ?? '').padEnd(w[i])).join('  ')).join('\n');
}
export const totalFailures = (rows) => sum(rows.map((r) => (r.error ? 1 : sum(Object.values(r.fail)))));

// the exact share of dealers with at most three numbered trionfi, from the size of the first hand
export function exactFewTrumps(handSize) { return hyperAtMost(78, 21, handSize, 3); }

function parseArgs(argv) {
	const a = { games: 'runnable', deals: 200, seed: 'r1', secrecy: 0, alts: 0, workers: Math.min(8, os.cpus().length), append: 0, out: path.join(WORK, 'robots_core.json'), censusOut: path.join(WORK, 'census.json') };
	for (let i = 0; i < argv.length; i += 2) {
		const k = argv[i].replace(/^--/, '');
		const v = argv[i + 1];
		if (k === 'games') a.games = v; else if (k === 'seed') a.seed = v;
		else if (k === 'out') a.out = v; else if (k === 'census-out') a.censusOut = v;
		else if (['deals', 'secrecy', 'alts', 'workers', 'append', 'false-claims'].includes(k)) a[k === 'false-claims' ? 'falseClaims' : k] = Number(v);
		else throw new Error('unknown option --' + k);
	}
	return a;
}

// the census of one row, with the exact value of what the deal alone decides
export function censusEntry(r) {
	const e = { counts: r.census, info: r.info, exact: {} };
	if (r.info.dealerHandSize) e.exact.dealer_few_trumps = exactFewTrumps(r.info.dealerHandSize);
	if (r.info.barredMax !== null) e.exact.discarder_all_barred = r.info.dealerHandSize > r.info.barredMax ? 0 : null;
	return e;
}

// the (game, seats) pairs asked for: `id`, `id:seats`, or `runnable`
export function selectCases(spec) {
	const cases = allCases();
	if (spec === 'runnable') return cases.filter((c) => c.support && c.support.runnable);
	const out = [];
	for (const item of spec.split(',')) {
		const [id, s] = item.split(':');
		const found = cases.filter((c) => c.id === id && (s === undefined || c.seats === Number(s)));
		if (!found.length) throw new Error('no such game or seat count: ' + item);
		out.push(...found);
	}
	return out;
}

// the alt leaves of the given cases whose alt the core plays
export function altTasks(cases) {
	const out = [];
	for (const c of cases) for (const a of c.support.alts) if (a.supported) out.push({ id: c.id, seats: c.seats, alt: a.path });
	return out;
}

async function main() {
	const a = parseArgs(process.argv.slice(2));
	const cases = selectCases(a.games);
	const refused = cases.filter((c) => !(c.support && c.support.runnable));
	for (const c of refused) console.log(`refused: ${c.id} with ${c.seats} seats is not runnable`);
	const run = cases.filter((c) => c.support && c.support.runnable);
	const tasks = a.deals > 0 ? run.map((c) => ({ id: c.id, seats: c.seats, deals: a.deals, seed: a.seed, secrecy: a.secrecy, falseClaims: a.falseClaims || 0 })) : [];
	if (a.alts > 0) for (const t of altTasks(run)) tasks.push({ ...t, deals: a.alts, seed: a.seed, secrecy: Math.min(a.secrecy, a.alts) });
	let rows = await runTasks(tasks, a.workers);
	if (a.append && fs.existsSync(a.out)) rows = [...JSON.parse(fs.readFileSync(a.out, 'utf8')).rows, ...rows];
	console.log(formatTable(rows));
	for (const r of rows) for (const s of r.samples.slice(0, 3)) console.log('FAIL', jstr(s));
	fs.mkdirSync(path.dirname(a.out), { recursive: true });
	fs.writeFileSync(a.out, JSON.stringify({ args: a, rows, failures: totalFailures(rows) }, null, 1));
	const census = {};
	if (a.append && fs.existsSync(a.censusOut)) Object.assign(census, JSON.parse(fs.readFileSync(a.censusOut, 'utf8')).census);
	for (const r of rows) if (!r.alt && !r.error) census[`${r.game}:${r.seats}`] = censusEntry(r);
	fs.writeFileSync(a.censusOut, JSON.stringify({ note: 'random robots: shares that depend on skill are upper bounds', census }, null, 1));
	console.log(`failures: ${totalFailures(rows)}; written ${a.out}`);
	process.exitCode = totalFailures(rows) ? 1 : 0;
}
if (isMainThread && process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
