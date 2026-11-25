// A wrong solver bot, for the tests: it throws at its first decision.
export function chooseAction() {
	throw new Error('boom');
}
