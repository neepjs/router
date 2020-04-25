
function getValue(v: any): string | undefined | null {
	if (v === undefined) { return undefined; }
	if (v === null) { return null; }
	if (v === false) { return undefined; }
	if (typeof v === 'number' && !Number.isFinite(v)) { return; }
	if (typeof v === 'function') { return; }
	return encodeURIComponent(String(v));
}
export function stringify(s: any): string {
	const list: string[] = [];
	for (const key of Object.keys(s)) {
		const value = s[key];
		const k = encodeURIComponent(key);
		if (!Array.isArray(value)) {
			const v = getValue(value);
			if (v === undefined) { continue; }
			list.push(v === null ? k : `${k}=${v}`);
			continue;
		}
		for (const val of value) {
			const v = getValue(val);
			if (v === undefined) { continue; }
			list.push(v === null ? k : `${k}=${v}`);
		}
	}
	return list.join('&');
}

export function parse(s: string): object {
	const query = Object.create(null);
	function set(k: string, v: null | string = null) {
		if (!(k in query)) {
			query[k] = v;
			return;
		}
		const it = query[k];
		if (Array.isArray(it)) {
			it.push(v);
		} else {
			query[k] = [it, v];
		}

	}
	for (const it of s.split('&')) {
		const index = it.indexOf('=');
		if (index < 0) {
			set(decodeURIComponent(it));
			continue;
		}
		const k = decodeURIComponent(it.substr(0, index));
		const v = decodeURIComponent(it.substr(index + 1));
		set(k, v);
	}
	return query;
}
