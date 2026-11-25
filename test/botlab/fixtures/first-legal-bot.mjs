// An example solver bot: it plays the first legal action of its view. It shows the contract of a bot module for
// `node tools/botlab.mjs --a-bot <module>`: export chooseAction({game, view, level, seed}); the answer is
// {action}, where action is one of view.legal. It uses no clock and no Math.random, so the same input gives the same answer.
export function chooseAction({ view }) {
	return { action: view.legal[0] };
}
