// Secrecy check of a message sent to one seat. Independent of the core's view code on purpose: it reads only the
// ground truth (snapshot, contract section 8) and the message.
import { CARD_ID_RE, sortCanonical } from './deck.mjs';

// Every card id in a message: any string value or key, at any depth. A raw string message counts too.
export function idsIn(message) {
	const found = new Set();
	const scan = s => { for (const m of String(s).matchAll(CARD_ID_RE)) found.add(m[0]); };
	const rec = v => {
		if (typeof v === 'string') scan(v);
		else if (Array.isArray(v)) v.forEach(rec);
		else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { scan(k); rec(x); }
	};
	rec(message);
	return found;
}

// Cards this seat may not know: the hands of the others, the discards that are not its own, the rest, the stock.
export function secretFor(snapshot, seat) {
	const secret = new Set();
	const me = String(seat);
	for (const [s, cards] of Object.entries(snapshot.hands || {})) if (s !== me) (cards || []).forEach(c => secret.add(c));
	for (const [s, cards] of Object.entries(snapshot.discard || {})) if (s !== me) (cards || []).forEach(c => secret.add(c));
	(snapshot.rest || []).forEach(c => secret.add(c));
	(snapshot.stock || []).forEach(c => secret.add(c));
	// the cards laid down in an exchange belong to the declarer alone (a holder knows only what he got: it is in his hand)
	const laid = snapshot.state?.exchange?.laid || [];
	if (String(snapshot.declarer) !== me) laid.forEach(c => secret.add(c));
	// what the seat holds or put aside itself is its own knowledge, whatever else says
	for (const c of snapshot.hands?.[me] || []) secret.delete(c);
	for (const c of snapshot.discard?.[me] || []) secret.delete(c);
	// what the seat laid down or gave away in an exchange it knows by itself
	if (String(snapshot.declarer) === me) for (const c of laid) secret.delete(c);
	for (const c of snapshot.state?.exchange?.gave?.[me] || []) secret.delete(c);
	return secret;
}

// What the rules make public, read from the ground truth only (no game id): the cards exposed in declarations, the cards
// called in an exchange (their names; who holds them stays secret), the called card of a partner call.
export function publicFrom(snapshot) {
	const pub = new Set();
	for (const m of snapshot.state?.declarations?.made || []) for (const c of m.cards || []) pub.add(c);
	for (const c of snapshot.state?.exchange?.called || []) pub.add(c);
	if (snapshot.state?.call_partner?.card) pub.add(snapshot.state.call_partner.card);
	if (snapshot.secret?.card) pub.add(snapshot.secret.card);
	return pub;
}

// A called partner is secret until his card is played: only the holder may see who he is. Checks a view message
// against the ground truth; returns a list of faults (empty: fine). Messages that are not views are not checked here.
export function seatLeaks(snapshot, seat, message) {
	const sec = snapshot.secret;
	if (!sec || sec.holder === null || sec.holder === undefined || message?.t !== 'view') return [];
	const holder = sec.holder;
	// the holder knows himself; a declarer who called his own card is known to all as the declarer
	if (String(holder) === String(seat) || String(holder) === String(snapshot.declarer)) return [];
	const v = message.view || {};
	const bad = [];
	if (v.call && v.call.partner !== null && v.call.partner !== undefined) bad.push('call.partner');
	const side = v.sides?.of?.[holder];
	if (side !== null && side !== undefined) bad.push('sides.of[holder]');
	return bad;
}

// publicCards: played cards, drawn cards shown to all, the Fool given after the hand (Array or Set).
// The cards a seat may call (action types call, call_partner) are named by the legal list: they are the cards it does not
// hold, which it knows from its own hand, so the names tell it nothing. They are left out of the scan.
const CALLING = new Set(['call', 'call_partner']);
export function withoutCallables(message) {
	if (!message || typeof message !== 'object') return message;
	const strip = (legal) => (Array.isArray(legal) ? legal.filter((a) => !(a && CALLING.has(a.type))) : legal);
	if (message.view && Array.isArray(message.view.legal)) return { ...message, view: { ...message.view, legal: strip(message.view.legal) } };
	if (Array.isArray(message.legal)) return { ...message, legal: strip(message.legal) };
	return message;
}

export function leaks(snapshot, publicCards, seat, message) {
	const pub = new Set(publicCards || []);
	const secret = secretFor(snapshot, seat);
	return sortCanonical([...idsIn(withoutCallables(message))].filter(id => secret.has(id) && !pub.has(id)));
}
