// Canonical JSON (sorted keys) and FNV-1a 64 over it, in plain 32-bit arithmetic.
export function canonical(v) {
	if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
	if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
	const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
	return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}

// UTF-8 bytes of a string (lone surrogates become U+FFFD, as TextEncoder does)
function utf8(str) {
	const out = [];
	for (let i = 0; i < str.length; i++) {
		let c = str.charCodeAt(i);
		if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
			c = 0x10000 + ((c - 0xd800) << 10) + (str.charCodeAt(++i) - 0xdc00);
		} else if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
		if (c < 0x80) out.push(c);
		else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
		else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
		else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
	}
	return out;
}

// FNV-1a 64 over the UTF-8 bytes of the text
export function fnv1a64(str) {
	let hi = 0xcbf29ce4, lo = 0x84222325;
	for (const byte of utf8(str)) {
		lo = (lo ^ byte) >>> 0;
		// multiply by the prime 2^40 + 0x1b3 modulo 2^64
		const loProd = lo * 0x1b3;
		const newLo = loProd % 4294967296;
		const carry = Math.floor(loProd / 4294967296);
		const newHi = (hi * 0x1b3 + carry + ((lo << 8) >>> 0)) % 4294967296;
		lo = newLo >>> 0; hi = newHi >>> 0;
	}
	return hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
}

export function hashOf(v) {
	return fnv1a64(canonical(v));
}
