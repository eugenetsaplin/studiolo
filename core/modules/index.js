// The registry of the modules the core plays, by name.
import * as deal from './deal.js';
import * as a_monte from './a_monte.js';
import * as discard from './discard.js';
import * as tricks from './tricks.js';
import * as prize_stock from './prize_stock.js';
import * as count from './count.js';
import * as result from './result.js';
import * as settle from './settle.js';
import * as repeat from './repeat.js';
import * as fuora from './fuora.js';
import * as open_piles from './open_piles.js';
import * as bidding from './bidding.js';
import * as exchange from './exchange.js';
import * as call_partner from './call_partner.js';
import * as declarations from './declarations.js';

export const MODULES = { deal, a_monte, discard, tricks, prize_stock, count, result, settle, repeat, fuora, open_piles, bidding, exchange, call_partner, declarations };

export const MODULE_VERSIONS = Object.fromEntries(Object.entries(MODULES).map(([k, m]) => [k, m.version]));
