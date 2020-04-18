
import { match, compile } from 'path-to-regexp';
import { RouteConfig, Route, Match } from './type';
import { cleanPath } from './util';


export function addRoute(
	cfg: RouteConfig,
	named: Record<string, Route>,
	parent?: Route,
) {
	let { path, children, alias, meta, component, components, ...p } = cfg;
	let end = !(Array.isArray(children) && children.length);
	if (!path || path === '*') {
		path = '';
		end = false;
	}
	if (path[0] !== '/') {
		path = `${parent?.path || ''}/${path}`;
	}
	path = cleanPath(path);
	if (component) {
		if (!components) {
			components = {};
		}
		components.default = component;
	}
	const item: Route = {
		...p,
		path,
		alias,
		component,
		components,
		meta: meta || {},
		toPath: compile(path || '', { encode: encodeURIComponent }),
		match: match(path || '', {end, decode: decodeURIComponent}),
	};
	if (alias) { named[alias] = item; }
	if (Array.isArray(children)) {
		item.children = children.map(c => addRoute(c, named, item));
	}
	return item;
}

export function *matchRoutes(path: string, routes: Route[] = []): Iterable<Match>{
	for (const route of routes) {
		const result = route.match(path);
		if (!result) { continue; }
		if (route.components || route.redirect) {
			yield { ...result, route };
		}
		if (!route.redirect) {
			yield* matchRoutes(path, route.children);
		}
		return;
	}
}
