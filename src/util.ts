export function cleanPath(path: string) {
	path = `/${path}`.replace(/\/+(\/|$)/g, '$1');
	while(/[^/]+\/\.{2,}(\/|$)/.test(path)) {
		path = path.replace(/\/[^/]+\/\.(\.+(?:\/|$))/g, '/$1');
	}
	path = path.replace(/\/\.+(\/|$)/g, '$1');
	return path || '/';
}