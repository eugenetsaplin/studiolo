// Shared by the bot tests: game loading and the 13 (game, seats) pairs the core plays.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame } from '../../core/index.js';
import { parseLevel } from '../../bots/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const getFile = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'rulesets', id + '.json'), 'utf8'));
export const level = (id) => parseLevel(JSON.parse(fs.readFileSync(path.join(ROOT, 'bots', 'levels', id + '.json'), 'utf8')));
export const PAIRS = [['venticinque', 2], ['morto', 2], ['venticinque_3', 3], ['partita_3', 3], ['partita_4', 4], ['consiglio', 4], ['dottore', 5],
	['meno', 2], ['meno', 3], ['meno', 4], ['meno', 5], ['meno', 6], ['meno', 7]];
export const game = (id, seats) => loadGame(id, getFile, { seats });
