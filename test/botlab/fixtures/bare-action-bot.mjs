// A wrong solver bot, for the tests: it answers the action itself, not {action}.
export function chooseAction({ view }) {
	return view.legal[0];
}
