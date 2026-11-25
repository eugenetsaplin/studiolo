// An example bot of your own. It plays as the bot of this repository does, with one change: it bids when
// its hand holds at least MIN_TRUMPS trumps (card ids that start with "T"); with fewer it passes.
// The contract: export chooseAction({game, view, level, seed}) and answer {action}, where action is one of view.legal.
// No clock and no Math.random: the same input must give the same answer.
import { chooseAction as library } from '../bots/index.js';

const MIN_TRUMPS = 8;

export function chooseAction({ game, view, level, seed }) {
	const answer = library({ game, view, level, seed });
	if (answer.action.type.startsWith('bid_')) {
		const trumps = view.hand.filter((id) => id.startsWith('T')).length;
		const pass = view.legal.find((a) => a.type === 'pass');
		if (trumps < MIN_TRUMPS && pass) return { action: pass };
	}
	return answer;
}
