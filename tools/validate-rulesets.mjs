#!/usr/bin/env node
// Checks the Studiolo rule files of format 3 with Node's built-in modules only (no packages).
//   node tools/validate-rulesets.mjs [--f2 <dir of format 2 files>] [--root <repo dir>] [files...]
//   node tools/validate-rulesets.mjs --stamp N [--root <repo dir>]
// Without files it checks every rulesets/*.json against rulesets/schema/game.schema.json and every
// rulesets/texts/*.texts.json against rulesets/schema/texts.schema.json, then the checks the schema cannot make:
// the marks of the sources, the open wording of every string (no Cyrillic, no internal words, no dotted dates), the phase references, the deal arithmetic, the rule paths and placeholders of the texts,
// and (with --f2) that every format 2 rule survives the conversion word for word.
//
// G5: every "by" of a rule leaf is a key of the file's "sources" table (or of the table of a file it extends) or a
// built-in id: torino1787, ours.
// "replace" (what would replace a placeholder) is allowed on [S] and [R] leaves only; its "q" is a row of OPEN_QUESTIONS.md.
//
// G6, the revision check (point 59). rulesets/REVISIONS.md holds, under every «## Revision N» heading, a machine block
//   <!-- files rN
//   <file name> sha256:<hex>
//   -->
// with every game file (rulesets/*.json, not the schema, not the texts) as it stands in revision N. HASH: sha256 of the
// bytes of the file with every CRLF turned into LF (hashBytes below; a table uses the same function). It fails when a
// game file's hash differs from the latest block, when a file is missing from it (or listed and gone), and when a file's
// key "revision" is not the number of the last block in which its hash changed.
// "--stamp N" writes the block of N under an existing «## Revision N» heading of the next number; it never edits a game file.
//
// The open wording (revision 3): a game file fails when a «source» holds a Cyrillic mark, when any string outside the
// values of «short_ru» holds a Cyrillic letter, when a string holds one of the internal words (INTERNAL_WORDS below)
// or a date written with dots (dd.mm, dd.mm.yyyy; a section number after GAME_FILE_FORMAT or FORMAT_OPEN_POINTS is not
// a date). With --f2 every string of the format 2 file first goes through tools/open-wording.mjs, because an older
// format 2 copy (not in this repository) keeps the old wording and is not ours to change.
//
// "--root <dir>" checks the copy of the repository in <dir> (used by the tests, on temporary copies).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openWordingDeep } from './open-wording.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILTIN_SOURCES = ['torino1787', 'ours'];

// sha256 (hex) of the bytes with CRLF turned into LF: the same value on Windows and Linux checkouts.
export function hashBytes(buf) {
	const lf = Buffer.from(Buffer.from(buf).toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
	return crypto.createHash('sha256').update(lf).digest('hex');
}
export const hashFile = f => hashBytes(fs.readFileSync(f));

// ---------- a small JSON Schema (draft 2020-12) validator: the keywords the two schemas use ----------
const KNOWN = new Set(['$schema', '$id', '$defs', '$ref', 'title', 'description', 'default', 'type', 'enum', 'const',
	'properties', 'required', 'additionalProperties', 'patternProperties', 'propertyNames', 'items', 'prefixItems',
	'minItems', 'maxItems', 'minProperties', 'maxProperties', 'minimum', 'maximum', 'exclusiveMinimum', 'minLength',
	'pattern', 'anyOf', 'oneOf', 'allOf', 'if', 'then', 'else']);

function typeOf(v) {
	if (v === null) return 'null';
	if (Array.isArray(v)) return 'array';
	if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
	return typeof v;
}
const typeOk = (v, t) => t === 'number' ? typeof v === 'number' : typeOf(v) === t;
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function validate(root, schema, data, at = '$') {
	const errors = [];
	const resolve = ref => {
		if (!ref.startsWith('#/')) throw new Error('only local $ref: ' + ref);
		return ref.slice(2).split('/').reduce((o, k) => o[k], root);
	};
	const check = (s, v, p) => {
		if (s === true || s === undefined) return [];
		if (s === false) return [`${p}: not allowed`];
		const e = [];
		for (const k of Object.keys(s)) if (!KNOWN.has(k)) throw new Error(`schema keyword not supported by this checker: ${k}`);
		if (s.$ref) e.push(...check(resolve(s.$ref), v, p));
		if (s.type) {
			const ts = Array.isArray(s.type) ? s.type : [s.type];
			if (!ts.some(t => typeOk(v, t))) return [...e, `${p}: expected ${ts.join('|')}, got ${typeOf(v)}`];
		}
		if (s.enum && !s.enum.some(x => deepEqual(x, v))) e.push(`${p}: ${JSON.stringify(v)} not one of ${JSON.stringify(s.enum)}`);
		if ('const' in s && !deepEqual(s.const, v)) e.push(`${p}: must be ${JSON.stringify(s.const)}`);
		if (typeof v === 'string') {
			if (s.minLength !== undefined && v.length < s.minLength) e.push(`${p}: shorter than ${s.minLength}`);
			if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) e.push(`${p}: «${v.slice(0, 60)}» does not match ${s.pattern}`);
		}
		if (typeof v === 'number') {
			if (s.minimum !== undefined && v < s.minimum) e.push(`${p}: below ${s.minimum}`);
			if (s.maximum !== undefined && v > s.maximum) e.push(`${p}: above ${s.maximum}`);
			if (s.exclusiveMinimum !== undefined && v <= s.exclusiveMinimum) e.push(`${p}: not above ${s.exclusiveMinimum}`);
		}
		if (Array.isArray(v)) {
			if (s.minItems !== undefined && v.length < s.minItems) e.push(`${p}: fewer than ${s.minItems} items`);
			if (s.maxItems !== undefined && v.length > s.maxItems) e.push(`${p}: more than ${s.maxItems} items`);
			const pre = s.prefixItems || [];
			v.forEach((x, i) => {
				if (i < pre.length) e.push(...check(pre[i], x, `${p}[${i}]`));
				else if (s.items !== undefined) e.push(...check(s.items, x, `${p}[${i}]`));
			});
		}
		if (typeOf(v) === 'object') {
			const keys = Object.keys(v);
			if (s.minProperties !== undefined && keys.length < s.minProperties) e.push(`${p}: fewer than ${s.minProperties} keys`);
			if (s.maxProperties !== undefined && keys.length > s.maxProperties) e.push(`${p}: more than ${s.maxProperties} keys`);
			for (const r of s.required || []) if (!(r in v)) e.push(`${p}: missing «${r}»`);
			for (const k of keys) {
				const q = `${p}.${k}`;
				if (s.propertyNames) e.push(...check(s.propertyNames, k, `${q} (name)`));
				let matched = false;
				if (s.properties && k in s.properties) { matched = true; e.push(...check(s.properties[k], v[k], q)); }
				for (const [re, ps] of Object.entries(s.patternProperties || {})) {
					if (new RegExp(re, 'u').test(k)) { matched = true; e.push(...check(ps, v[k], q)); }
				}
				if (!matched && s.additionalProperties !== undefined) {
					if (s.additionalProperties === false) e.push(`${q}: unknown key`);
					else e.push(...check(s.additionalProperties, v[k], q));
				}
			}
		}
		if (s.allOf) for (const sub of s.allOf) e.push(...check(sub, v, p));
		if (s.anyOf) {
			const results = s.anyOf.map(sub => check(sub, v, p));
			if (!results.some(r => r.length === 0)) {
				e.push(`${p}: matches none of anyOf (${results.map(r => r[0]).join(' / ')})`);
			}
		}
		if (s.oneOf) {
			const ok = s.oneOf.filter(sub => check(sub, v, p).length === 0).length;
			if (ok !== 1) e.push(`${p}: matches ${ok} of oneOf, needs exactly 1`);
		}
		if (s.if) {
			if (check(s.if, v, p).length === 0) { if (s.then) e.push(...check(s.then, v, p)); }
			else if (s.else) e.push(...check(s.else, v, p));
		}
		return e;
	};
	errors.push(...check(schema, data, at));
	return errors;
}

// ---------- the open wording of a game file (revision 3) ----------
const CYRILLIC = /[\u0400-\u04FF]/u;
const CYRILLIC_MARK = /^\[(\u0414|\u041f|\u041d)\]/u;
// Internal words: a local list, tools/internal-words.local.json (not part of an export; without the file the check
// has no list of internal words and the other checks run as before). Format:
//   { "words": ["…"], "patterns": ["…"] }
// "words": substrings, compared without regard to case. "patterns": sources of JavaScript regular expressions
// (flag u only; write (?i:…) for a part that ignores case).
const INTERNAL_WORDS_FILE = path.join(HERE, 'internal-words.local.json');

// The list as [name, regular expression] pairs, from the parsed content of the file. Exported for the tests.
export function compileInternalWords(spec) {
	const out = [];
	for (const w of (spec && Array.isArray(spec.words) ? spec.words : [])) {
		if (typeof w === 'string' && w) out.push([w, new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu')]);
	}
	for (const p of (spec && Array.isArray(spec.patterns) ? spec.patterns : [])) {
		if (typeof p === 'string' && p) out.push([p, new RegExp(p, 'u')]);
	}
	return out;
}
function loadInternalWords() {
	let text;
	try { text = fs.readFileSync(INTERNAL_WORDS_FILE, 'utf8'); } catch { return []; }
	return compileInternalWords(JSON.parse(text));
}
const INTERNAL_WORDS = loadInternalWords();

// A section number of our own documents is not a date: «GAME_FILE_FORMAT 11.12», «FORMAT_OPEN_POINTS point 6.3».
const SECTION_REF = /(GAME_FILE_FORMAT|FORMAT_OPEN_POINTS)\s+(?:points?\s+|section\s+)?\d+(?:\.\d+)*/gu;
// A date with dots: dd.mm, dd.mm.yyyy, d.m.yy (two digits for day and month when there is no year, so «1.32 %» is not a date).
const DOTTED_DATE = /(?<![\d.])(?:(?:0[1-9]|[12]\d|3[01])\.(?:0[1-9]|1[0-2])|(?:[1-9]|0[1-9]|[12]\d|3[01])\.(?:[1-9]|0[1-9]|1[0-2])\.\d{2,4})(?!\d)/u;

function* strings(node, p = '$') {
	if (typeof node === 'string') { yield [p, node]; return; }
	if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) yield* strings(node[i], p + '[' + i + ']'); return; }
	if (typeOf(node) === 'object') for (const [k, v] of Object.entries(node)) yield* strings(v, p + '.' + k);
}

// The problems of one game file: Cyrillic, internal words, dotted dates. Exported for the tests.
// `internalWords` is the list of compileInternalWords(); by default the one read from the local file.
export function openWordingProblems(game, internalWords = INTERNAL_WORDS) {
	const e = [];
	for (const [p, s] of strings(game)) {
		if (p.endsWith('.short_ru')) continue;
		const clip = x => '«' + x.slice(0, 50) + '»';
		if (p.endsWith('.source') && CYRILLIC_MARK.test(s)) e.push(p + ': a Cyrillic mark (use [D] [R] [S]): ' + clip(s));
		else if (CYRILLIC.test(s)) e.push(p + ': a Cyrillic letter outside «short_ru»: ' + clip(s.slice(Math.max(0, s.search(CYRILLIC) - 15))));
		for (const [name, re] of internalWords) if (re.test(s)) e.push(p + ': the internal word «' + name + '»: ' + clip(s));
		const m = DOTTED_DATE.exec(s.replace(SECTION_REF, ' '));
		if (m) e.push(p + ': a date written with dots («' + m[0] + '»): write it out, «2 November 2026»');
	}
	return e;
}

// ---------- the checks a schema cannot make ----------
function* walk(node, p = '$') {
	if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) yield* walk(node[i], `${p}[${i}]`); return; }
	if (typeOf(node) !== 'object') return;
	yield [p, node];
	for (const [k, v] of Object.entries(node)) yield* walk(v, `${p}.${k}`);
}

function phasesOf(game) {
	const out = [];
	const rec = list => { for (const ph of list || []) { out.push(ph); rec(ph.phases); } };
	rec(game.hand?.phases);
	return out;
}

// A rule path of the texts file and the rules page: seats.count, cards.fool, match.hands, hand.<phase id>.<key>.
function resolvePath(game, p) {
	const parts = p.split('.');
	let node;
	if (parts[0] === 'hand') {
		const ph = phasesOf(game).find(x => x.id === parts[1]);
		if (!ph) return undefined;
		node = parts.length === 2 ? ph : ph.settings;
		parts.splice(0, 2);
	} else {
		node = game;
	}
	for (const k of parts) { if (node == null) return undefined; node = node[k]; }
	return node;
}

const valueFor = (v, seats) => (v && typeOf(v) === 'object' && v.by_seats) ? v.by_seats[String(seats)] : v;

// ctx.sourceIds: Set of the source ids a "by" may name (own table, tables of the parents, built-in); null = not checked.
// ctx.questions: Set of the question numbers of OPEN_QUESTIONS.md; null = not checked.
function semanticGame(game, ctx = {}) {
	const e = [];
	// 1. every leaf with a source carries one of the three marks first (the schema checks rule leaves; this catches all others)
	for (const [p, node] of walk(game)) {
		if (typeof node.source === 'string' && !/^\[(D|R|S)\] /u.test(node.source)) e.push(`${p}.source: no mark [D] [R] [S] at the start`);
		if ('value' in node && !('source' in node) && !p.startsWith('$.view') && !p.startsWith('$.options')) e.push(`${p}: a value without a source`);
		// G5: «by» names a source of the table or a built-in one
		if (typeof node.by === 'string' && typeof node.source === 'string' && ctx.sourceIds && !ctx.sourceIds.has(node.by)) e.push(`${p}.by: «${node.by}» is not in «sources» and not built in (${BUILTIN_SOURCES.join(', ')})`);
		// R9: a leaf of another book («by») names its pages itself; the page is never read from the first «p. N» of the source
		if (typeof node.by === 'string' && node.by !== 'ours' && typeof node.source === 'string' && !(Array.isArray(node.pages) && node.pages.length)) e.push(`${p}: has «by» (${node.by}) but no «pages»: the page of that book must be written in «pages»`);
		// «replace» only where there is a placeholder
		if ('replace' in node) {
			if (typeof node.source !== 'string' || !/^\[(R|S)\] /u.test(node.source)) e.push(`${p}.replace: allowed on [S] and [R] leaves only`);
			if (ctx.questions && Number.isInteger(node.replace?.q) && !ctx.questions.has(node.replace.q)) e.push(`${p}.replace.q: no question ${node.replace.q} in OPEN_QUESTIONS.md`);
		}
	}
	e.push(...openWordingProblems(game));
	// 2. phase ids unique; during/after point at a phase
	const phases = phasesOf(game);
	const ids = new Set();
	for (const ph of phases) {
		if (ids.has(ph.id)) e.push(`phase id «${ph.id}» used twice`);
		ids.add(ph.id);
	}
	for (const ph of phases) {
		for (const k of ['during', 'after']) if (ph[k] && !ids.has(ph[k])) e.push(`phase «${ph.id}».${k}: no phase «${ph[k]}»`);
	}
	const mods = phases.map(p => p.module);
	for (const m of ['deal', 'tricks', 'count', 'result']) if (!game.extends && !mods.includes(m)) e.push(`no «${m}» phase (every game deals, plays tricks, counts and ends)`);
	// 3. the deal arithmetic of the simple deal, for every seat count the file allows
	const deals = phases.filter(p => p.module === 'deal');
	const multiDeal = deals.length > 1 || deals.some(p => p.settings?.from?.value === 'rest') || phases.filter(p => p.module === 'discard').length > 1;
	const deal = deals[0];
	const seatList = [].concat(game.seats?.count?.value ?? []);
	if (multiDeal && game.cards?.deck?.value === 'full78') {
		for (const n of seatList) e.push(...dealSequence(game, phases, n));
	} else if (deal && deal.settings && game.cards?.deck?.value === 'full78') {
		for (const n of seatList) {
			const s = deal.settings;
			// point 48: «piles» is a list of pile sizes per seat (Baronetti 10, 10, 10, 9); it replaces hand_size
			const pileList = valueFor(s.piles?.value, n);
			const hasPiles = Array.isArray(pileList) && pileList.every(x => typeof x === 'number');
			const hand = valueFor(s.hand_size?.value, n) ?? (hasPiles ? 0 : undefined);
			const extra = valueFor(s.dealer_extra?.value ?? 0, n);
			const piles = hasPiles ? pileList.reduce((a, b) => a + b, 0)
				: (valueFor(s.pile_count?.value ?? 0, n)) * (valueFor(s.pile_size?.value ?? 0, n));
			if (typeof hand !== 'number' || typeof extra !== 'number') continue;
			const dealt = n * (hand + piles) + extra;
			const left = 78 - dealt;
			const tricks = hand + piles;
			const dead = s.dead?.value;
			if (left < 0) e.push(`${n} seats: the deal needs ${dealt} cards, the deck has 78`);
			if (dead === 'none' && left !== 0) e.push(`${n} seats: dead «none» but ${left} cards are left`);
			if (dead === 'prize' && left < tricks) e.push(`${n} seats: dead «prize» needs ${tricks} cards, ${left} are left`);
			const disc = phases.find(p => p.module === 'discard');
			const dcount = valueFor(disc?.settings?.count?.value, n);
			if (typeof dcount === 'number' && dcount !== extra && disc?.settings?.count_mode?.value !== 'up_to') {
				e.push(`${n} seats: the dealer gets ${extra} extra cards but discards ${dcount}`);
			}
		}
	}
	e.push(...actionTypeProblems(game));
	return e;
}

// a number for a role (the dealer or not) from a count, a {by_role} or a {by_seats}
function roleNumber(v, n, role) {
	if (v && typeOf(v) === 'object' && v.by_seats) v = v.by_seats[String(n)];
	if (v && typeOf(v) === 'object' && v.by_role) {
		const r = v.by_role;
		return role === 'dealer' ? (r.dealer ?? r.others) : (r.non_dealer ?? r.others);
	}
	return v;
}

// A hand with two deals or two discards (a second deal from the cards left): the cards are counted deal by deal and
// discard by discard for the dealer and for any other seat, and every seat must end with the same number of cards,
// else the tricks could not be played out.
function dealSequence(game, phases, n) {
	const e = [];
	const at = (m) => `${n} seats, ${m}`;
	const has = { dealer: 0, other: 0 };
	let rest = 78;
	let dealt = false;
	for (const ph of phases) {
		const w = ph.when || {};
		if (w.contract || w.all_passed !== undefined) continue;
		if (w.seats && !w.seats.includes(n)) continue;
		const s = ph.settings || {};
		const val = (k) => s[k]?.value;
		if (ph.module === 'deal') {
			const extra = roleNumber(val('dealer_extra') ?? 0, n, 'dealer');
			const fromRest = val('from') === 'rest';
			if (!fromRest && dealt && val('hand_size') !== 'half_rest') { e.push(at(`phase «${ph.id}»: a second deal from the whole deck: use from: rest`)); continue; }
			let per = { dealer: 0, other: 0 };
			if (val('hand_size') === 'half_rest') {
				if (!fromRest) e.push(at(`phase «${ph.id}»: half_rest needs from: rest`));
				const left = rest - extra;
				if (left < 0 || left % n !== 0) e.push(at(`phase «${ph.id}»: ${left} cards cannot be shared by ${n} seats`));
				per = { dealer: Math.floor(left / n), other: Math.floor(left / n) };
			} else {
				per = { dealer: roleNumber(val('hand_size'), n, 'dealer'), other: roleNumber(val('hand_size'), n, 'other') };
				if (typeof per.dealer !== 'number' || typeof per.other !== 'number') continue;
			}
			const total = per.dealer + extra + per.other * (n - 1);
			if (total > rest) { e.push(at(`phase «${ph.id}»: the deal needs ${total} cards, ${rest} are left`)); continue; }
			has.dealer += per.dealer + extra;
			has.other += per.other;
			rest -= total;
			dealt = true;
			if (val('dead') === 'none' && rest !== 0) e.push(at(`phase «${ph.id}»: dead «none» but ${rest} cards are left`));
		} else if (ph.module === 'discard' && dealt) {
			const who = val('who') ?? 'dealer';
			const mode = val('count_mode') ?? 'exact';
			const roles = who === 'each' ? ['dealer', 'other'] : ['dealer'];
			for (const role of roles) {
				const c = roleNumber(val('count') ?? val('dealer_extra') ?? 0, n, role === 'other' ? 'non_dealer' : 'dealer');
				if (typeof c !== 'number') continue;
				if (mode === 'up_to') { e.push(at(`phase «${ph.id}»: count_mode up_to leaves the hand sizes open: the tricks could not be played out (use exact)`)); continue; }
				if (c > has[role]) e.push(at(`phase «${ph.id}»: ${role} discards ${c} but holds ${has[role]}`));
				has[role] -= c;
			}
		}
	}
	if (dealt && has.dealer !== has.other) e.push(at(`the hands end with ${has.dealer} cards (dealer) and ${has.other} (others): the tricks could not be played out`));
	return e;
}

// an action type is journaled as /[a-z_]{1,24}/: a contract id (bid_<id>) or a declaration kind (declare_<id>) that does not fit is refused
function actionTypeProblems(game) {
	const e = [];
	const ok = (t) => /^[a-z_]{1,24}$/.test(t);
	for (const c of Array.isArray(game.contracts) ? game.contracts : []) {
		if (c && typeof c.id === 'string' && !ok('bid_' + c.id)) e.push(`contract «${c.id}»: the action bid_${c.id} must be 1-24 letters a-z and _ (the id: 1-20 letters a-z and _)`);
	}
	for (const ph of phasesOf(game)) {
		if (ph.module !== 'declarations') continue;
		for (const k of ph.settings?.kinds?.value ?? []) {
			if (typeof k?.id === 'string' && !ok('declare_' + k.id)) e.push(`phase «${ph.id}», kind «${k.id}»: the action declare_${k.id} must be 1-24 letters a-z and _ (the id: 1-16 letters a-z and _)`);
		}
	}
	return e;
}

const PLACEHOLDER = /\{([a-z][a-z0-9_.]*)(?::[a-z]+)?\}/g;

function semanticTexts(texts, game) {
	const e = [];
	if (!game) return [`texts for «${texts.game}»: no game file rulesets/${texts.game}.json`];
	for (const [lang, L] of Object.entries(texts)) {
		if (typeOf(L) !== 'object') continue;
		const lines = [];
		for (const sec of ['short', 'memo', 'hints', 'lesson']) (L[sec] || []).forEach((x, i) => lines.push([`${lang}.${sec}[${i}]`, x]));
		for (const [p, x] of lines) {
			for (const r of x.rules) if (resolvePath(game, r) === undefined) e.push(`${p}: rule path «${r}» is not in the game file`);
			for (const m of x.text.matchAll(PLACEHOLDER)) {
				if (m[1].startsWith('card') || m[1].startsWith('set')) continue;
				if (resolvePath(game, m[1]) === undefined) e.push(`${p}: placeholder {${m[1]}} is not in the game file`);
				else if (!x.rules.includes(m[1])) e.push(`${p}: placeholder {${m[1]}} is not listed in «rules»`);
			}
			const bare = x.text.replace(PLACEHOLDER, '');
			if (/[0-9]/.test(bare)) e.push(`${p}: a digit outside a placeholder («${x.text.slice(0, 50)}…»): numbers come from the game file`);
		}
		for (const r of Object.keys(L.rule_text || {})) if (resolvePath(game, r) === undefined) e.push(`${lang}.rule_text: «${r}» is not in the game file`);
	}
	for (const lang of Object.keys(texts)) if (/^[a-z]{2}$/.test(lang) && lang !== 'ru' && lang !== 'en') e.push(...textsParity(texts.en, texts[lang], lang));
	return e;
}

// The placeholders of one text, sorted: «path» for {path}, «path|» for a plural {path|one:..|other:..}.
// Card and set tokens and any other {…} count too: a translation keeps every one of them.
const ANY_TOKEN = /\{([^{}|]+)(\|[^{}]*)?\}/g;
const tokensOf = (s) => [...String(s).matchAll(ANY_TOKEN)].map((m) => (m[2] ? `${m[1]}|` : m[1])).sort();
const pluralNames = (s) => [...String(s).matchAll(ANY_TOKEN)].filter((m) => m[2]).map((m) => [m[1], m[2].slice(1).split('|').map((p) => p.split(':')[0].trim())]);
const NAME_MAPS = ['rule_text', 'terms', 'variant_names', 'option_names', 'penalty_names', 'contract_names', 'left_out'];

// A language beside ru and en (it, fr, …) is checked against the English block: the same keys, the same lines with the
// same ids, rules, phases and lesson steps; every text keeps the placeholders of the English text, a plural stays a
// plural (with at least «one» and «other»); no Cyrillic letter (a Russian text left in by mistake).
export function textsParity(en, L, lang) {
	const e = [];
	if (typeOf(en) !== 'object') return e;
	if (typeOf(L) !== 'object') return [`${lang}: not an object`];
	const keysEn = Object.keys(en).sort().join(',');
	const keysL = Object.keys(L).sort().join(',');
	if (keysEn !== keysL) e.push(`${lang}: keys «${keysL}» differ from en «${keysEn}»`);
	const text = (where, a, b) => {
		if (typeof a !== 'string') return;
		if (typeof b !== 'string' || (a.trim() && !b.trim())) { e.push(`${where}: missing (en: «${a.slice(0, 40)}…»)`); return; }
		if (CYRILLIC.test(b)) e.push(`${where}: a Cyrillic letter («${b.slice(0, 40)}…»)`);
		const ta = tokensOf(a).join(' '), tb = tokensOf(b).join(' ');
		if (ta !== tb) e.push(`${where}: placeholders «${tb}» differ from en «${ta}»`);
		for (const [p, forms] of pluralNames(b)) if (!forms.includes('one') || !forms.includes('other')) e.push(`${where}: the plural of {${p}} needs «one» and «other» (has ${forms.join(', ')})`);
	};
	for (const k of ['name', 'subtitle', 'tagline']) text(`${lang}.${k}`, en[k], L[k]);
	for (const sec of ['short', 'memo', 'hints', 'lesson']) {
		const A = en[sec] || [], B = L[sec] || [];
		if (A.length !== B.length) { e.push(`${lang}.${sec}: ${B.length} lines, en has ${A.length}`); continue; }
		A.forEach((a, i) => {
			const b = B[i] || {}, w = `${lang}.${sec}[${i}]`;
			for (const k of ['id', 'phase', 'expect']) if (a[k] !== b[k]) e.push(`${w}.${k}: «${b[k]}», en has «${a[k]}»`);
			if (!deepEqual(a.rules, b.rules)) e.push(`${w}.rules: differ from en`);
			if (!deepEqual(a.setup, b.setup)) e.push(`${w}.setup: differs from en`);
			text(`${w}.text`, a.text, b.text);
			if ('title' in a) text(`${w}.title`, a.title, b.title);
		});
	}
	for (const m of NAME_MAPS) {
		const A = en[m] || {}, B = L[m] || {};
		const ka = Object.keys(A).sort().join(','), kb = Object.keys(B).sort().join(',');
		if (ka !== kb) { e.push(`${lang}.${m}: keys «${kb}» differ from en «${ka}»`); continue; }
		for (const k of Object.keys(A)) text(`${lang}.${m}.${k}`, A[k], B[k]);
	}
	return e;
}

// With --f2: every format 2 rule leaf (game, match), the about and the left_out survive word for word.
function checkF2(f3, f2) {
	const e = [];
	const leaves = [];
	for (const [p, node] of walk(f3)) if ('value' in node && 'source' in node) leaves.push([p, node]);
	for (const sec of ['game', 'match']) {
		for (const [k, leaf] of Object.entries(f2[sec] || {})) {
			const hit = leaves.find(([p, n]) => p.endsWith('.' + k) && deepEqual(n.value, leaf.value) && n.source === leaf.source);
			if (!hit) e.push(`format 2 ${sec}.${k}: not found word for word`);
		}
	}
	if (f2.about !== f3.about) e.push('format 2 about: changed');
	if (!deepEqual(f2.left_out, f3.left_out)) e.push('format 2 left_out: changed');
	if (!deepEqual(f2.versions, f3.versions)) e.push('format 2 versions: changed');
	return e;
}

// ---------- G6: the revisions ----------
const SECTION = /^## Revision (\d+)\b/u;

// Reads REVISIONS.md: [{n, files: Map(name -> hash)}] in the order of the headings, plus problems of the shape.
export function parseRevisions(text) {
	const problems = [];
	const pending = [];
	const blocks = [];
	const sections = text.split(/^(?=## )/m);
	for (const sec of sections) {
		const h = SECTION.exec(sec);
		if (!h) continue;
		const n = Number(h[1]);
		const m = /<!-- files r(\d+)\r?\n([\s\S]*?)-->/.exec(sec);
		if (!m) { pending.push(n); continue; }
		if (Number(m[1]) !== n) { problems.push(`the block «files r${m[1]}» stands under the heading of revision ${n}`); continue; }
		const files = new Map();
		for (const line of m[2].split(/\r?\n/)) {
			if (!line.trim()) continue;
			const f = /^(\S+) sha256:([0-9a-f]{64})\s*$/.exec(line);
			if (!f) { problems.push(`revision ${n}: bad line «${line.slice(0, 60)}»`); continue; }
			files.set(f[1], f[2]);
		}
		blocks.push({ n, files });
	}
	blocks.sort((a, b) => a.n - b.n);
	blocks.forEach((b, i) => { if (b.n !== i + 1) problems.push(`the blocks must be numbered 1, 2, 3 ...: found r${b.n} at place ${i + 1}`); });
	return { blocks, problems, pending };
}

export function gameFilesOf(rulesetsDir) {
	return fs.readdirSync(rulesetsDir).filter(f => f.endsWith('.json')).sort();
}

// Returns {global: [text], byFile: {name: [text]}}.
export function checkRevisions(rulesetsDir, revisionsText, readJson) {
	const out = { global: [], byFile: {} };
	const add = (f, t) => (out.byFile[f] ??= []).push(t);
	const { blocks, problems, pending } = parseRevisions(revisionsText);
	out.global.push(...problems);
	for (const n of pending) out.global.push(`heading «Revision ${n}» has no «<!-- files r${n}» block: run --stamp ${n}`);
	const names = gameFilesOf(rulesetsDir);
	if (!blocks.length) { out.global.push('REVISIONS.md has no «<!-- files rN» block: run --stamp 1'); return out; }
	const last = blocks[blocks.length - 1];
	for (const name of names) {
		const hash = hashFile(path.join(rulesetsDir, name));
		if (!last.files.has(name)) add(name, `not in the block r${last.n} of REVISIONS.md (a new file needs a new revision)`);
		else if (last.files.get(name) !== hash) add(name, `changed since revision ${last.n} (hash ${hash.slice(0, 12)}…): no new entry in REVISIONS.md (order: heading «## Revision N», edit of the file with "revision": N, then --stamp N)`);
		// the number of the last block in which the hash changed
		let changedIn = 0;
		let prev;
		for (const b of blocks) {
			const h = b.files.get(name);
			if (h !== undefined && h !== prev) changedIn = b.n;
			prev = h;
		}
		const rev = readJson(path.join(rulesetsDir, name)).revision;
		if (last.files.get(name) === hash && rev !== changedIn) add(name, `"revision" is ${rev}, but the file last changed in revision ${changedIn} (order: heading, edit of the file with the new "revision", then --stamp)`);
	}
	for (const name of last.files.keys()) if (!names.includes(name)) out.global.push(`${name} is in the block r${last.n} but the file is gone`);
	return out;
}

export function stampBlock(n, rulesetsDir) {
	const lines = gameFilesOf(rulesetsDir).map(f => `${f} sha256:${hashFile(path.join(rulesetsDir, f))}`);
	return `<!-- files r${n}\n${lines.join('\n')}\n-->`;
}

// Writes the block of revision n under its heading. Returns {ok, why}.
export function stamp(root, n) {
	const rulesetsDir = path.join(root, 'rulesets');
	const file = path.join(rulesetsDir, 'REVISIONS.md');
	if (!fs.existsSync(file)) return { ok: false, why: 'rulesets/REVISIONS.md is missing: write it with the heading «## Revision N» first' };
	const raw = fs.readFileSync(file, 'utf8');
	const eol = raw.includes('\r\n') ? '\r\n' : '\n';
	const text = raw.replace(/\r\n/g, '\n');
	const { blocks, problems } = parseRevisions(text);
	if (problems.length) return { ok: false, why: problems[0] };
	const heading = new RegExp(`^## Revision ${n}\\b.*$`, 'mu').exec(text);
	if (!heading) return { ok: false, why: `no heading «## Revision ${n}» in REVISIONS.md: write the entry first` };
	const next = (blocks.length ? blocks[blocks.length - 1].n : 0) + 1;
	if (n !== next) return { ok: false, why: `the next revision is ${next}, not ${n}` };
	const at = heading.index + heading[0].length;
	const out = text.slice(0, at) + '\n\n' + stampBlock(n, rulesetsDir) + text.slice(at);
	fs.writeFileSync(file, eol === '\n' ? out : out.replace(/\n/g, eol));
	return { ok: true, why: `block r${n} written for ${gameFilesOf(rulesetsDir).length} files` };
}

// ---------- main ----------
function sourceIdsOf(game, getGame, seen = new Set()) {
	const ids = new Set(BUILTIN_SOURCES);
	for (const k of Object.keys(game.sources || {})) ids.add(k);
	if (game.extends && !seen.has(game.extends)) {
		seen.add(game.extends);
		const parent = getGame(game.extends);
		if (parent) for (const k of sourceIdsOf(parent, getGame, seen)) ids.add(k);
	}
	return ids;
}

function questionNumbers(file) {
	if (!fs.existsSync(file)) return null;
	const set = new Set();
	for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
		const m = /^\|\s*(\d+)\s*\|/.exec(line);
		if (m) set.add(Number(m[1]));
	}
	return set;
}

function main(args) {
	let f2dir = null;
	let root = path.resolve(HERE, '..');
	let stampN = null;
	const files = [];
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--f2') f2dir = args[++i];
		else if (args[i] === '--root') root = path.resolve(args[++i]);
		else if (args[i] === '--stamp') stampN = Number(args[++i]);
		else files.push(path.resolve(args[i]));
	}
	const RULESETS = path.join(root, 'rulesets');
	if (stampN !== null) {
		if (!Number.isInteger(stampN) || stampN < 1) { console.log('--stamp needs a revision number'); return 1; }
		const r = stamp(root, stampN);
		console.log(r.ok ? `stamped: ${r.why}` : `REFUSED: ${r.why}`);
		return r.ok ? 0 : 1;
	}
	const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
	const gameSchema = read(path.join(RULESETS, 'schema', 'game.schema.json'));
	const textsSchema = read(path.join(RULESETS, 'schema', 'texts.schema.json'));
	const getGame = id => { const f = path.join(RULESETS, id + '.json'); return fs.existsSync(f) ? read(f) : null; };
	const questions = questionNumbers(path.join(RULESETS, 'OPEN_QUESTIONS.md'));
	if (!files.length) {
		for (const f of gameFilesOf(RULESETS)) files.push(path.join(RULESETS, f));
		const td = path.join(RULESETS, 'texts');
		if (fs.existsSync(td)) for (const f of fs.readdirSync(td)) if (f.endsWith('.texts.json')) files.push(path.join(td, f));
	}
	const revFile = path.join(RULESETS, 'REVISIONS.md');
	const rev = fs.existsSync(revFile) ? checkRevisions(RULESETS, fs.readFileSync(revFile, 'utf8'), read)
		: { global: ['rulesets/REVISIONS.md is missing'], byFile: {} };

	let bad = 0;
	if (rev.global.length) { bad++; console.log('FAIL rulesets/REVISIONS.md'); for (const x of rev.global) console.log('   ' + x); }
	for (const f of files) {
		const data = read(f);
		const isTexts = data.kind === 'texts';
		let errs = validate(isTexts ? textsSchema : gameSchema, isTexts ? textsSchema : gameSchema, data);
		if (!errs.length) {
			if (isTexts) {
				const gf = path.join(RULESETS, data.game + '.json');
				errs = semanticTexts(data, fs.existsSync(gf) ? read(gf) : null);
			} else {
				errs = semanticGame(data, { sourceIds: sourceIdsOf(data, getGame), questions });
				if (path.dirname(f) === RULESETS) {
					// the loader finds a game by the file name: "id" must equal it (this also rules out two files with one id)
					if (data.id !== path.basename(f, '.json')) errs.push(`"id" is «${data.id}», but the file is ${path.basename(f)}: the id must equal the file name`);
					errs.push(...(rev.byFile[path.basename(f)] || []));
				}
				if (f2dir && data.converted_from) {
					const f2file = path.join(f2dir, data.id + '.json');
					if (fs.existsSync(f2file)) errs.push(...checkF2(data, openWordingDeep(read(f2file))));
					else errs.push(`--f2: no ${f2file}`);
				}
			}
		}
		const rel = path.relative(root, f);
		if (errs.length) { bad++; console.log(`FAIL ${rel}`); for (const x of errs.slice(0, 40)) console.log('   ' + x); }
		else console.log(`ok   ${rel}`);
	}
	return bad ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exit(main(process.argv.slice(2)));
