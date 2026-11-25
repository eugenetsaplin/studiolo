// The bot of Studiolo: Perfect-Information Monte Carlo for every game the core plays. Pure: no files, no clock, no
// Math.random. The game's rules are read from the Game; no game is known by name. See docs/BOT.md.
import { makeRng } from '../core/index.js';
import { chooseAction as chooseRandom } from './random.js';
import { decide } from './pimc.js';

export const BOT_ID = 'pimc';

const KEYS = ['format', 'id', 'name', 'worlds', 'budget_plays', 'halving', 'rollout', 'noise', 'temperature', 'forget', 'win_weight', 'pace_ms', 'bid_margin', 'slip'];
// keys a level may leave out (the default is in the code that reads them)
const OPTIONAL = ['bid_margin', 'slip'];
const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const isNum = (x, lo, hi) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;

// Validates a level file (parsed JSON). Throws on an unknown key or a bad value.
export function parseLevel(json) {
	if (json === null || typeof json !== 'object' || Array.isArray(json)) throw new Error('level: not an object');
	if (json.id === 'random') {
		for (const k of Object.keys(json)) if (k !== 'id') throw new Error('level: unknown key ' + k);
		return { id: 'random' };
	}
	for (const k of Object.keys(json)) if (!KEYS.includes(k)) throw new Error('level: unknown key ' + k);
	for (const k of KEYS) if (!(k in json) && !OPTIONAL.includes(k)) throw new Error('level: missing key ' + k);
	const bad = (k) => { throw new Error('level: bad value of ' + k); };
	if (json.format !== 1) bad('format');
	if (typeof json.id !== 'string' || !/^[a-z0-9_]{1,24}$/.test(json.id)) bad('id');
	const nm = json.name;
	if (nm === null || typeof nm !== 'object' || typeof nm.ru !== 'string' || typeof nm.en !== 'string') bad('name');
	if (Object.keys(nm).some((k) => k !== 'ru' && k !== 'en')) bad('name');
	if (!isInt(json.worlds, 1, 1000)) bad('worlds');
	if (!isInt(json.budget_plays, 1, 10000000)) bad('budget_plays');
	if (typeof json.halving !== 'boolean') bad('halving');
	if (json.rollout !== 'random' && json.rollout !== 'greedy') bad('rollout');
	if (!isNum(json.noise, 0, 1)) bad('noise');
	if (!isNum(json.temperature, 0, 1000)) bad('temperature');
	if (!isNum(json.forget, 0, 1)) bad('forget');
	if (!isNum(json.win_weight, -1000, 1000)) bad('win_weight');
	if (!isInt(json.pace_ms, 0, 60000)) bad('pace_ms');
	if ('bid_margin' in json && !isNum(json.bid_margin, 0, 1000)) bad('bid_margin');
	if ('slip' in json && !isNum(json.slip, 0, 1)) bad('slip');
	return { ...json, name: { ru: nm.ru, en: nm.en } };
}

// {game, view, level, seed} -> {action, eval: [{action, value}], stats: {worlds, plays, candidates}}
// view is hand.view(seat) as the client gets it; the answer is one of view.legal. Same input, same answer.
export function chooseAction({ game, view, level, seed }) {
	const lv = level && level.id === 'random' && Object.keys(level).length === 1 ? level : parseLevel(level);
	const legal = view.legal;
	if (lv.id === 'random') {
		const action = chooseRandom(legal, makeRng(String(seed)));
		return { action, eval: [], stats: { worlds: 0, plays: 0, candidates: legal.length } };
	}
	return decide({ game, view, level: lv, seed: String(seed) });
}
