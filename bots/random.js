// The random robot: one legal action, uniform. The a_monte proposal is taken with probability 0.05 when offered
// (the other actions share the rest).
export function chooseAction(actions, rng) {
	if (!actions.length) return null;
	const propose = actions.find((a) => a.type === 'a_monte_propose');
	if (propose && rng.next() < 0.05) return propose;
	const rest = propose ? actions.filter((a) => a !== propose) : actions;
	if (!rest.length) return propose;
	return rest[rng.int(rest.length)];
}
