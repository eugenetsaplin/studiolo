// Why this module exists. The game files of Studiolo are written in the open wording (revision 3): the marks of the
// sources are Latin letters [D] documented, [R] our reading, [S] sources silent, and the unit of payment keeps its
// Italian name («marca», «marche»), so that «mark» means only these three. An older format 2 copy
// (read only, for `validate-rulesets.mjs --f2`) is NOT ours to change and still carries the old wording:
// Cyrillic marks [\u0414] [\u041f] [\u041d], the legend «[\u041f] probable, [\u041d] ours», and the English «mark»/«marks» for a payment.
// Before the conversion check compares them with a game file, every string of the format 2 file goes through
// openWording(), which turns the old wording into the new one and does nothing else. If the check still reports a
// difference after this, the difference is real: do not widen this function to hide it.

export const LEGEND = 'Marks: [D] documented, [R] our reading, [S] sources silent.';

const CYRILLIC_MARKS = { '\u0414': 'D', '\u041f': 'R', '\u041d': 'S' };

// One string in the old wording -> the same string in the open wording.
export function openWording(s) {
	if (typeof s !== 'string') return s;
	return s
		.replace(/\[(\u0414|\u041f|\u041d)\]/gu, (_, c) => `[${CYRILLIC_MARKS[c]}]`)
		// the legend sentence of an «about»: «Marks: [D] documented, [R] probable, [S] ours.»
		.replace(/Marks: \[D\] documented[^.]*\./u, LEGEND)
		// a trailing note « since K<number>» of an older file is dropped
		.replace(/ since K\d{1,2}\b/gu, '')
		// the unit of payment: whole lowercase words only («Marks:» of the legend is not touched)
		.replace(/\bmarks\b/gu, 'marche')
		.replace(/\bmark\b/gu, 'marca');
}

// The same for every string of a JSON value (keys are left alone).
export function openWordingDeep(v) {
	if (typeof v === 'string') return openWording(v);
	if (Array.isArray(v)) return v.map(openWordingDeep);
	if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, openWordingDeep(x)]));
	return v;
}
