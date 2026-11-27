// The hand: one state machine that runs the phases of the game file in order. A phase is a module; the engine asks
// the current module who acts, what is legal, and applies the action. Everything the hand knows is in `s`, plain
// JSON, so a hand is cloned, hashed and replayed from its seed and its log.
import { sortCards, INDEX } from './cards.js';
import { hashOf } from './hash.js';
import { seatsOfSide } from './util.js';
import { cardsNeeded } from './modules/deal.js';
import { livePoints } from './modules/count.js';
import { reasonOf as trickReason } from './modules/tricks.js';
import { scoreLines } from './score.js';

const isInt = (x) => Number.isInteger(x);

function deepClone(x) {
	if (x === null || typeof x !== 'object') return x;
	if (Array.isArray(x)) {
		const out = new Array(x.length);
		for (let i = 0; i < x.length; i++) out[i] = deepClone(x[i]);
		return out;
	}
	const out = {};
	for (const k in x) out[k] = deepClone(x[k]);
	return out;
}

function sameAction(a, b) {
	return a.type === b.type && a.card === b.card;
}

// what a seat knows of the sides: all of them, except while a called partner is secret
function knownSide(s, sides, viewer, q) {
	if (!s.secret || viewer === s.secret.holder) return sides.of[q];
	if (q === s.declarer || q === viewer) return sides.of[q];
	return null;
}

export class Hand {
	constructor(game, s) {
		this.game = game;
		this.s = s;
	}

	get log() { return this.s.log; }

	// the sides of this hand: the ones a contract made (s.sides), else the fixed map of the game file
	sides() { return this.s.sides || this.game.sides; }

	// does this plan entry run in this hand? A phase may depend on the winning contract or on an all-pass auction.
	runs(entry) {
		const w = entry.when;
		if (!w) return true;
		const s = this.s;
		if (w.contract !== undefined && !(s.contract !== null && w.contract.includes(s.contract))) return false;
		if (w.all_passed !== undefined && !!w.all_passed !== !!s.allPassed) return false;
		return true;
	}

	// the contract of the game file by id (null when the file has none of that id)
	contractById(id) { return (this.game.rules.contracts || []).find((c) => c.id === id) || null; }

	// a contract is won by a seat: the hand takes its sides (a called partner joins later, setPartner)
	setContract(id, declarer) {
		const s = this.s;
		const c = this.contractById(id);
		s.contract = id;
		s.declarer = declarer;
		const mode = c && c.sides ? c.sides : 'declarer_vs_rest';
		const of = [];
		for (let q = 0; q < s.n; q++) of.push(mode === 'each_for_self' ? q : (q === declarer ? 0 : 1));
		const pool = mode === 'each_for_self' ? 'seat' : (this.game.cfg.sides.pool && this.game.cfg.sides.pool !== 'seat' ? this.game.cfg.sides.pool : 'side');
		s.sides = { mode, of, pool };
	}

	// the holder of the called card joins the side of the declarer
	setPartner(seat) {
		const s = this.s;
		if (s.sides && seat !== s.declarer) s.sides.of[seat] = s.sides.of[s.declarer];
	}

	// the hand ends at once with nobody paying: everybody passed, or the like
	throwIn(reason) {
		const s = this.s;
		const gamePoints = {};
		for (let q = 0; q < s.n; q++) gamePoints[q] = 0;
		s.result = { outcome: 'thrown_in', winners: [], reason, payments: [], gamePoints, points: {}, sidePoints: {}, breakdown: {}, worst: [] };
		s.phase = 'over';
		s.pi = this.game.plan.length;
		s.over = true;
		return [{ e: 'thrown_in', reason }];
	}
	get cur() { return this.game.plan[this.s.pi]; }

	entry(moduleName) { return this.game.plan.find((e) => e.module === moduleName); }

	// how the a_monte phase windows the deal: 'packet', 'deal' or null (no such phase)
	aMonteWindows() {
		const e = this.entry('a_monte');
		if (!e) return null;
		const w = e.set.windows || ['deal'];
		return w.includes('deal.packet') ? 'packet' : 'deal';
	}

	// the hooks of the host phase that offer more than the host does (contract: onPlay, playable, extraLegal, ...)
	hooks() { return this.game.hooks.tricks || []; }

	// how many cards the deal inside a repeat group takes from the pack in one round
	dealNeed() { return cardsNeeded(this); }

	// the seats that are out of the hand while the others play on (s.outs, in the order they went out; none in a hand
	// that ends with the first to go out)
	outSeats() { return (this.s.outs || []).map((o) => o.seat); }

	// the seats that still play, in the order of the seats: every seat, less those that have gone out. The one place that
	// says how many play in a trick and in a deal.
	playing() {
		const out = this.outSeats();
		const all = [];
		for (let q = 0; q < this.s.n; q++) if (!out.includes(q)) all.push(q);
		return all;
	}

	// the first seat from `seat` (itself included) that still plays, going round to the right
	firstPlaying(seat) {
		const out = this.outSeats();
		let q = seat;
		for (let i = 0; i < this.s.n && out.includes(q); i++) q = (q + 1) % this.s.n;
		return q;
	}

	// the seat after `seat` that still plays
	nextPlaying(seat) { return this.firstPlaying((seat + 1) % this.s.n); }

	// has the first seat that plays no cards left? (those that play hold as many each; seat 0 when nobody has gone out)
	playingEmpty() { return this.s.hands[this.firstPlaying(0)].length === 0; }

	// has the repeat group of the phase just finished run its course? (sets s.stockEmpty when the next deal cannot be made)
	groupDone(group) {
		const s = this.s;
		// a first to go out ends the group, unless the others play on (s.outs): then only the pack can end it
		if (group.until !== 'stock_empty' && s.out !== null && !(s.outs && s.outs.length)) return true;
		if (group.until === 'fuora') {
			// a valid claim ends the group at once (endHand); here only the pack can end it
			if (s.rest.length < this.dealNeed()) { s.stockEmpty = true; return true; }
			return false;
		}
		if (s.rest.length < this.dealNeed()) { s.stockEmpty = true; return true; }
		return false;
	}

	// from the phase at s.pi to the next one that has something to do. `skipLoop`: leave the repeat group at once.
	advance(skipLoop = false) {
		const s = this.s;
		const plan = this.game.plan;
		const events = [];
		for (;;) {
			const here = s.pi >= 0 ? plan[s.pi] : null;
			let next = s.pi + 1;
			if (here && here.group && s.pi === here.group.last && !skipLoop) {
				if (this.groupDone(here.group)) { if (s.stockEmpty) events.push({ e: 'stock_empty' }); } else {
					const g = here.group;
					next = g.first;
					s.round++;
					s.trick = [];
					for (let i = g.first; i <= g.last; i++) delete s.m[plan[i].module];
					events.push({ e: 'round_dealt', index: s.round });
				}
			}
			skipLoop = false;
			s.pi = next;
			if (s.pi >= plan.length) { s.phase = 'over'; s.over = true; break; }
			const e = plan[s.pi];
			if (!this.runs(e)) continue;
			s.phase = e.id;
			const r = e.mod.enter(this);
			events.push(...r.events);
			if (!r.done) break;
		}
		return events;
	}

	// a hook ends the hand now: leave the group of the current phase and go to the count
	endHand() {
		const s = this.s;
		const g = this.cur.group;
		s.pi = g ? g.last : s.pi;
		return this.advance(true);
	}

	// does a hook keep the phase open although the host is done (a claim window before the next deal)?
	holdOpen() {
		return this.hooks().some((e) => e.mod && e.mod.hold && e.mod.hold(this, e));
	}

	isOver() { return this.s.over; }

	toAct() {
		const s = this.s;
		if (s.over) return [];
		const out = this.cur.mod.toAct(this).slice();
		for (const e of this.hooks()) {
			if (e.mod && e.mod.extraToAct) for (const q of e.mod.extraToAct(this, e)) if (!out.includes(q)) out.push(q);
		}
		return out;
	}

	extras(seat) {
		const out = [];
		for (const e of this.hooks()) if (e.mod && e.mod.extraLegal) for (const a of e.mod.extraLegal(this, e, seat)) out.push({ a, e });
		return out;
	}

	legal(seat) {
		const s = this.s;
		if (s.over || !isInt(seat) || !this.toAct().includes(seat)) return [];
		const host = this.cur.mod.toAct(this).includes(seat) ? this.cur.mod.legal(this, seat) : [];
		return host.concat(this.extras(seat).map((x) => x.a));
	}

	apply(seat, action) {
		const s = this.s;
		if (s.over) return { ok: false, code: 'over', why: 'the hand is over' };
		if (!isInt(seat) || !this.toAct().includes(seat)) return { ok: false, code: 'not_to_act', why: 'it is not this seat to act' };
		if (action === null || typeof action !== 'object' || typeof action.type !== 'string') return { ok: false, code: 'bad_action', why: 'not an action' };
		const extra = this.extras(seat).find((x) => sameAction(x.a, action));
		const host = this.cur.mod.toAct(this).includes(seat) ? this.cur.mod.legal(this, seat) : [];
		const found = extra ? extra.a : host.find((a) => sameAction(a, action));
		if (!found) return { ok: false, code: 'illegal', why: 'this action is not legal now' };
		s.log.push({ seat, action: { ...found } });
		if (extra) {
			const r = extra.e.mod.applyExtra(this, extra.e, seat, found);
			const events = r.events.slice();
			if (r.endHand) events.push(...this.endHand());
			else if (r.done && !this.holdOpen()) events.push(...this.advance());
			return { ok: true, events };
		}
		const r = this.cur.mod.apply(this, seat, found);
		const events = r.events;
		if (r.done && !this.holdOpen()) events.push(...this.advance());
		return { ok: true, events };
	}

	result() { return this.s.over ? this.s.result : null; }

	// the cards a seat sees as its hand: all of them, unless a hook shows only some (the open tops of piles)
	visibleHand(seat) {
		for (const e of this.hooks()) {
			if (e.mod && e.mod.visibleHand) { const r = e.mod.visibleHand(this, e, seat); if (r) return r.slice(); }
		}
		return this.s.hands[seat].slice();
	}

	// view.contract: public facts of the contract; the modules that know more add theirs (contractView hook)
	contractView() {
		const s = this.s;
		if (s.contract === null) return null;
		const out = { id: s.contract, declarer: s.declarer, laid: 0, called: [] };
		for (const e of this.game.plan) {
			if (!e.mod || !e.mod.contractView || !this.runs(e)) continue;
			const part = e.mod.contractView(this, e);
			if (part && part.laid !== undefined) out.laid = part.laid;
			if (part && part.called) out.called.push(...part.called);
		}
		return out;
	}

	clone() { return new Hand(this.game, deepClone(this.s)); }

	snapshot() {
		const s = this.s;
		const bySeat = (arrs) => { const o = {}; arrs.forEach((a, i) => { o[i] = a.slice(); }); return o; };
		const more = {};
		if (s.round > 0) more.round = s.round;
		if (s.out !== null) more.out = deepClone(s.out);
		if (s.outs && s.outs.length) more.outs = deepClone(s.outs);
		if (s.stockEmpty) more.stockEmpty = true;
		if (s.piles !== null) more.piles = deepClone(s.piles);
		if (s.shown.some((l) => l.length)) more.shown = bySeat(s.shown);
		if (s.contract !== null) more.contract = s.contract;
		if (s.declarer !== null) more.declarer = s.declarer;
		if (s.sides !== null) more.sides = deepClone(s.sides);
		if (s.secret !== null) more.secret = deepClone(s.secret);
		if (s.allPassed) more.allPassed = true;
		return {
			...more,
			seed: s.seed, dealer: s.dealer, phase: s.phase, toAct: this.toAct(), cut: s.cut, packets: s.packets.slice(),
			hands: bySeat(s.hands), discard: bySeat(s.discard), rest: s.rest.slice(), stock: s.stock.slice(), won: bySeat(s.won),
			trick: s.trick.map((t) => ({ ...t })), tricks: deepClone(s.tricks), foolGive: deepClone(s.foolGive),
			log: deepClone(s.log), redeals: s.aCount, drawn: deepClone(s.drawn), state: deepClone(s.m), result: deepClone(s.result),
		};
	}

	checksum() { return hashOf(this.snapshot()); }

	view(seat) {
		if (!Number.isInteger(seat) || seat < 0 || seat >= this.s.n) throw new RangeError('bad seat: ' + seat);
		const s = this.s;
		const g = this.game;
		const n = s.n;
		const sides = this.sides();
		const seatsList = Array.from({ length: n }, (_, i) => i);
		const counts = (arrs) => { const o = {}; seatsList.forEach((i) => { o[i] = arrs[i].length; }); return o; };
		const hooks = g.hooks.tricks || [];
		const seen = (drawer) => hooks.every((e) => !e.mod.visibleTo || e.mod.visibleTo(this, seat, drawer));
		const m = s.m.tricks;
		const mon = s.m.a_monte;
		const phaseMod = s.over ? null : this.cur.module;
		const v = {
			game: g.id, revision: g.revision, seat, seats: n, dealer: s.dealer,
			phase: { id: s.phase, module: phaseMod },
			toAct: this.toAct(),
			hand: this.visibleHand(seat),
			handCounts: counts(s.hands),
			// the cards of a seat that went out lie face down: not even he sees them again
			discard: { mine: this.outSeats().includes(seat) ? [] : s.discard[seat].slice(), counts: counts(s.discard) },
			rest: { count: s.rest.length },
			stock: { count: s.stock.length, drawn: s.drawn.filter((d) => seen(d.seat)).map((d) => ({ ...d })) },
			trick: { leader: s.trick.length ? s.trick[0].seat : (m ? m.turn : null), cards: s.trick.map((t) => ({ ...t })) },
			tricks: s.tricks.map((t) => ({ leader: t.leader, cards: t.cards.map((c) => ({ ...c })), winner: t.winner, fool: t.fool, prize: t.prize !== null && seen(s.drawn.find((d) => d.card === t.prize).seat) ? t.prize : null, reason: trickReason(this, t) })),
			won: counts(s.won),
			sides: { mode: sides.mode, of: Object.fromEntries(sides.of.map((x, i) => [i, knownSide(s, sides, seat, i)])) },
			legal: this.legal(seat),
			aMonte: mon ? { stage: mon.stage, proposer: mon.proposer, awaiting: this.toAct(), redeals: s.aCount } : null,
			result: s.over ? deepClone(s.result) : null,
			match: s.carry && s.carry.match ? { kind: s.carry.match.kind, handIndex: s.carry.match.handIndex, standing: null } : null,
		};
		if (g.rules.contracts && g.plan.some((e) => e.module === 'bidding')) v.contract = this.contractView();
		for (const e of g.plan) {
			if (e.mod && e.mod.viewPart && this.runs(e)) Object.assign(v, e.mod.viewPart(this, e, seat));
		}
		if (g.plan.some((e) => e.group)) v.round = { index: s.round, stock: s.rest.length };
		if (g.rules.view && g.rules.view.score_panel && g.rules.view.score_panel.live_points === 'own') v.points = { mine: livePoints(this, seat) };
		for (const e of this.hooks()) {
			if (e.mod && e.mod.viewOf) v[e.module] = e.mod.viewOf(this, e, seat);
		}
		if (g.cfg.sides.partners_share_hands && sides.mode !== 'each_for_self') {
			v.partnerHands = {};
			for (const q of seatsOfSide(sides, sides.of[seat])) if (q !== seat) v.partnerHands[q] = s.hands[q].slice();
		}
		// the ready lines of the score panel, from this view and the rules (the result stays as it is)
		if (s.over) v.scoreLines = scoreLines(g, v);
		return v;
	}
}

export function newHand(game, init) {
	if (!game.support.runnable) throw new Error('the game has rules the core does not play; see support.missing');
	const n = game.seats;
	if (!isInt(init.dealer) || init.dealer < 0 || init.dealer >= n) throw new Error('bad dealer');
	const arrs = () => Array.from({ length: n }, () => []);
	const s = {
		seed: String(init.seed), dealer: init.dealer, n, preset: init.preset || null, carry: init.carry ? deepClone(init.carry) : null,
		pi: -1, phase: '', hands: arrs(), discard: arrs(), won: arrs(), rest: [], stock: [], trick: [], tricks: [], cut: null, packets: [],
		foolGive: null, log: [], aCount: 0, drawn: [], m: {}, result: null, over: false,
		round: 0, out: null, outs: [], stockEmpty: false, piles: null, shown: arrs(),
		contract: null, declarer: null, sides: null, secret: null, allPassed: false,
	};
	const h = new Hand(game, s);
	h.advance();
	return h;
}

export function replayHand(game, init, log) {
	const h = newHand(game, init);
	log.forEach((step, i) => {
		const r = h.apply(step.seat, step.action);
		if (!r.ok) throw new Error(`replay: action ${i} refused (${r.code})`);
	});
	return h;
}

export { INDEX, sortCards };
