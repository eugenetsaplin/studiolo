#!/usr/bin/env node
// The core and the robots must be pure and know no game.
//   node tools/check-core-pure.mjs [--root <repo dir>]
// Fails (exit 1) when a .js/.mjs/.cjs file under core/ or bots/
//   - holds, as a word, a game id (the names of rulesets/*.json) or a "family" value of a game file (comments count);
//   - imports node:fs, node:net, node:http, node:https, node:child_process, node:dgram, node:tls, http2, dns, worker_threads, cluster (also without «node:»);
//   - uses Date, Math.random, process, globalThis, performance, crypto (comments, strings and regex literals are ignored; ${...} code counts).
// Code for a browser, if there is any (every .js/.mjs file in the folders of WEB_DIRS) is checked for two things only:
//   - no game id or family as a word (comments count; the same word list);
//   - nothing is loaded from another origin: no "http://" or "https://" (nor a bare "//host") inside an import, fetch,
//     src or href string, a Worker or EventSource, or an XHR open. The XML namespace URIs of w3.org are not loads.
//   - a WebSocket to the page's own host is allowed when its address is built from `location` (`ws://${location.host}/ws`);
//     a literal ws:// or wss:// address with a host name fails.
// Exit 0 with «no core yet» when core/ does not exist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BAD_MODULES = ['fs', 'fs/promises', 'net', 'http', 'http2', 'https', 'child_process', 'dgram', 'tls', 'dns', 'dns/promises', 'worker_threads', 'cluster'];

function listFiles(dir) {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...listFiles(p));
		else if (/\.(m?js|cjs)$/.test(e.name)) out.push(p);
	}
	return out;
}

// Removes comments and, unless keepStrings, the text of string literals and regex literals; keeps the line
// structure. The code inside ${...} of a template literal is kept: it is code.
const REGEX_AFTER_WORD = /(?:^|[^\w$.])(?:return|typeof|case|in|of|delete|void|throw|new|yield|await|else|do)\s*$/;
export function stripCode(src, keepStrings = false) {
	let out = '';
	let i = 0;
	let tpl = false; // inside the text of a template literal
	const stack = []; // 'b' = a { of code, 't' = a ${ of a template
	const nl = ch => (ch === '\n' ? '\n' : '');
	while (i < src.length) {
		const c = src[i], d = src[i + 1];
		if (tpl) {
			if (c === '\\') { out += keepStrings ? c + (d ?? '') : nl(d); i += 2; }
			else if (c === '`') { out += c; tpl = false; i++; }
			else if (c === '$' && d === '{') { out += '${'; stack.push('t'); tpl = false; i += 2; }
			else { out += keepStrings ? c : nl(c); i++; }
			continue;
		}
		if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; }
		else if (c === '/' && d === '*') {
			i += 2;
			while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { out += nl(src[i]); i++; }
			i += 2;
		} else if (c === '"' || c === "'") {
			out += c; i++;
			while (i < src.length && src[i] !== c && src[i] !== '\n') {
				if (src[i] === '\\') { if (keepStrings) out += src[i]; i++; }
				if (keepStrings) out += src[i] ?? '';
				i++;
			}
			out += c; i++;
		} else if (c === '`') { out += c; tpl = true; i++; }
		else if (c === '{') { stack.push('b'); out += c; i++; }
		else if (c === '}') { if (stack.pop() === 't') tpl = true; out += c; i++; }
		else if (c === '/') {
			const before = out.replace(/\s+$/, '');
			const prev = before.slice(-1);
			if (!before || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || REGEX_AFTER_WORD.test(before)) {
				i++;
				let cls = false;
				while (i < src.length && src[i] !== '\n' && (cls || src[i] !== '/')) {
					if (src[i] === '\\') i++;
					else if (src[i] === '[') cls = true;
					else if (src[i] === ']') cls = false;
					i++;
				}
				i++;
				while (/[a-z]/.test(src[i] ?? '')) i++;
				out += '/ /';
			} else { out += c; i++; }
		} else { out += c; i++; }
	}
	return out;
}

export function gameWords(rulesetsDir) {
	const words = new Set();
	if (!fs.existsSync(rulesetsDir)) return words;
	for (const f of fs.readdirSync(rulesetsDir).filter(x => x.endsWith('.json'))) {
		words.add(f.slice(0, -5));
		try {
			const g = JSON.parse(fs.readFileSync(path.join(rulesetsDir, f), 'utf8'));
			if (typeof g.id === 'string') words.add(g.id);
			if (typeof g.family === 'string') words.add(g.family);
		} catch { /* a broken game file is the validator's business */ }
	}
	return words;
}

export function checkFile(file, words) {
	const raw = fs.readFileSync(file, 'utf8');
	const code = stripCode(raw);
	const withStrings = stripCode(raw, true); // comments gone, strings kept: for the import check
	const problems = [];
	const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
	for (const w of words) {
		const m = new RegExp(`(?<![A-Za-z0-9_])${w}(?![A-Za-z0-9_])`, 'i').exec(raw);
		if (m) problems.push(`line ${lineOf(raw, m.index)}: the game name «${w}»`);
	}
	const mods = BAD_MODULES.map(m => m.replace('/', '\\/')).join('|');
	const imp = new RegExp(`(?:from\\s*|import\\s*\\(?\\s*|require\\s*\\(\\s*)['"](?:node:)?(?:${mods})['"]`);
	const im = imp.exec(withStrings);
	if (im) problems.push(`line ${lineOf(withStrings, im.index)}: import of an I/O module (${im[0].replace(/\s+/g, ' ')})`);
	const uses = [
		[/(?<![A-Za-z0-9_$.])Date(?![A-Za-z0-9_$])/, 'Date'],
		[/\bMath\s*\.\s*random\b/, 'Math.random'],
		[/(?<![A-Za-z0-9_$.])process(?![A-Za-z0-9_$])/, 'process'],
		[/(?<![A-Za-z0-9_$])globalThis(?![A-Za-z0-9_$])/, 'globalThis'],
		[/(?<![A-Za-z0-9_$.])(?:performance|crypto)(?![A-Za-z0-9_$])|\bgetRandomValues\b|\brandomUUID\b/, 'performance or crypto (a clock or a random source)'],
		[/\bMath\s*\[|=\s*Math\s*[;,)]|\{[^{}]*\brandom\b[^{}]*\}\s*=\s*Math\b/, 'Math taken apart (random by another way)'],
	];
	for (const [re, what] of uses) {
		const m = re.exec(code);
		if (m) problems.push(`line ${lineOf(code, m.index)}: use of ${what}`);
	}
	return problems;
}

export const WEB_DIRS = ['web/table', 'web/shared', 'web/site/js'];
const ORIGIN = String.raw`(?:(?:https?|wss?):)?\/\/(?!www\.w3\.org\/)`;
const Q = '[\'"' + String.fromCharCode(96) + ']'; // a quote of a string literal: ' " or a backtick
const rx = (src, flags) => new RegExp(src.replaceAll('Q', Q).replaceAll('ORIGIN', ORIGIN), flags);
const EXTERNAL = [
	[rx(String.raw`(?:from\s*|import\s*\(?\s*)Q\s*(?:https?:\/\/|\/\/)`), 'import from another origin'],
	[rx(String.raw`\b(?:fetch|importScripts)\s*\(\s*Q\s*ORIGIN`), 'fetch or importScripts of another origin'],
	[rx(String.raw`\bnew\s+(?:Worker|SharedWorker|EventSource)\s*\(\s*Q\s*ORIGIN`), 'Worker or EventSource of another origin'],
	// A WebSocket to the page's own host is not external: its address is built from `location`, as in
	// `ws://${location.host}/ws`. A literal address with a host name is external.
	[rx(String.raw`\bnew\s+WebSocket\s*\(\s*Q\s*ORIGIN(?!\$\{\s*location\b)`), 'WebSocket to a literal host'],
	[rx(String.raw`\.open\s*\(\s*Q[A-Za-z]+Q\s*,\s*Q\s*ORIGIN`), 'XHR to another origin'],
	[rx(String.raw`\b(?:src|href|srcset|action|poster)\b\s*[=:]\s*\\?Q?\s*ORIGIN`, 'i'), 'src, href or the like pointing to another origin'],
	[rx(String.raw`setAttribute\s*\(\s*Q(?:src|href|srcset|action|poster)Q\s*,\s*Q\s*ORIGIN`), 'setAttribute to another origin'],
	[rx(String.raw`url\(\s*\\?Q?\s*ORIGIN`, 'i'), 'url() to another origin'],
];

export function checkWebFile(file, words) {
	const raw = fs.readFileSync(file, 'utf8');
	const withStrings = stripCode(raw, true);
	const problems = [];
	const lineOf = (text, idx) => text.slice(0, idx).split(String.fromCharCode(10)).length;
	for (const w of words) {
		const m = new RegExp(`(?<![A-Za-z0-9_])${w}(?![A-Za-z0-9_])`, 'i').exec(raw);
		if (m) problems.push(`line ${lineOf(raw, m.index)}: the game name «${w}»`);
	}
	for (const [re, what] of EXTERNAL) {
		const m = re.exec(withStrings);
		if (m) problems.push(`line ${lineOf(withStrings, m.index)}: ${what} (${m[0].replace(/\s+/g, ' ').slice(0, 60)})`);
	}
	return problems;
}

export function check(root) {
	const dirs = ['core', 'bots'].map(d => path.join(root, d)).filter(d => fs.existsSync(d));
	const results = [];
	const words = gameWords(path.join(root, 'rulesets'));
	for (const d of dirs) for (const f of listFiles(d)) results.push([path.relative(root, f), checkFile(f, words)]);
	for (const d of WEB_DIRS.map(x => path.join(root, x)).filter(x => fs.existsSync(x))) {
		for (const f of listFiles(d)) results.push([path.relative(root, f).split(path.sep).join('/'), checkWebFile(f, words)]);
	}
	return { hasCore: fs.existsSync(path.join(root, 'core')), results };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const i = process.argv.indexOf('--root');
	const root = i > 0 ? path.resolve(process.argv[i + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	const { hasCore, results } = check(root);
	if (!hasCore) console.log('no core yet');
	let bad = 0;
	for (const [f, p] of results) {
		if (p.length) { bad++; console.log(`FAIL ${f}`); p.forEach(x => console.log('   ' + x)); }
		else console.log(`ok   ${f}`);
	}
	process.exit(bad ? 1 : 0);
}
