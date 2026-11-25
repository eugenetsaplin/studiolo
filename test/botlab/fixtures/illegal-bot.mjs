// A wrong solver bot, for the tests: from its third decision on it answers an action that is not in view.legal.
let calls = 0;
export function chooseAction({ view }) {
	calls++;
	if (calls < 3) return { action: view.legal[0] };
	return { action: { type: 'play', card: 'no:such' } };
}
