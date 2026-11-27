// Revision 11: Mitigati for two has a window of declarations in the first trick (a seat declares with its card, and once more
// after the last card of the trick, «continue» first). Every level of the bot goes through the window: it declares everything
// offered, one at a time, then says declare_done, and the hand is played to its end.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newHand } from '../../core/index.js';
import { chooseAction } from '../../bots/index.js';
import { game, level } from './lib.mjs';

const LEVELS = [['random', { id: 'random' }, 8], ['easy', level('easy'), 8], ['normal', level('normal'), 2], ['strong', level('strong'), 1]];

for (const [name, lv, hands] of LEVELS) {
	test(`mitigati_2: the ${name} bot declares what is offered in the window and the hands end`, () => {
		const g = game('mitigati_2', 2);
		const seen = { declared: 0, windowDone: 0, closing: 0 };
		for (let d = 0; d < hands; d++) {
			const h = newHand(g, { seed: `win${name}${d}`, dealer: d % 2 });
			for (let k = 0; !h.isOver(); k++) {
				assert.ok(k < 3000, 'the hand does not end');
				const q = h.toAct()[0];
				const v = h.view(q);
				const a = chooseAction({ game: g, view: v, level: lv, seed: `${name}${d}:${k}` }).action;
				assert.ok(v.legal.some((x) => JSON.stringify(x) === JSON.stringify(a)), 'a legal answer');
				const offered = v.legal.filter((x) => x.type.startsWith('declare_') && x.type !== 'declare_done');
				if (name !== 'random' && offered.length) {
					// everything that can be declared is declared before the card, one at a time
					assert.ok(a.type.startsWith('declare_') && a.type !== 'declare_done', `${name}: ${a.type} while ${offered.map((x) => x.type)} are offered`);
					seen.declared++;
				}
				if (v.declarations && v.declarations.closing) {
					seen.closing++;
					if (name !== 'random' && !offered.length) { assert.equal(a.type, 'declare_done'); seen.windowDone++; }
				}
				assert.ok(h.apply(q, a).ok);
			}
			assert.ok(h.result(), 'a result');
		}
		if (name !== 'random') assert.ok(seen.declared > 0, `${name}: nothing was declared (${JSON.stringify(seen)})`);
	});
}
