import Neep from '@neep/core';
import install from './install/neep';
import { Error, value } from './install/neep';
import RouterView from './View';
import RouterLink from './Link';
import { Route, Location, IHistory, Match, RouteConfig } from './types';
import { cleanPath } from './util';
import { addRoute, matchRoutes } from './route';
import { stringify, parse } from './query';
import * as history from './history';
import { createShellComponent } from './install/neep';

function get(
	location: Location | string,
	routes: Record<string, Route>,
	basePath: string,
	stringifyQuery = stringify,
): {
	path: string;
	search: string;
	hash: string;
} {
	if (typeof location === 'string') { location = { path: location }; }

	const route = location.alias && routes[location.alias];
	const result = location.path && /^([^?#]*)((?:\?[^#]*)?)((?:#.*)?)$/
		.exec(location.path);
	let path = result?.[1] || '';
	if (!path) {
		path = route ? route.toPath(location.params || {}) : basePath;
	} else if (route) {
		let routePath = route.toPath(location.params || {});
		if (!location.append) {
			routePath = routePath.replace(/\/[^/]*\/?$/, '');
		}
		path = `${route.toPath(location.params || {})}/${path}`;
	} else if (location.append) {
		path = `${basePath}/${path}`;
	} if (path[0] !== '/') {
		path = `${basePath.replace(/\/[^/]*\/?$/, '')}/${path}`;
	}
	path = cleanPath(path);
	const search = location.query && `?${ stringifyQuery(location.query) }`
		|| location.search || result?.[2] || '';
	const hash = location.hash || result?.[3] || '';
	return { path, search, hash };
}

const redirects: string[] = [];
class Router {
	static get history() { return history; }
	static get install() { return install; }
	static get View() { return RouterView; }
	static get Link() { return RouterLink; }
	stringify?(query: Record<any, any>): string;
	parse?(search: string): Record<any, any>;
	private _namedRoutes: Record<string, Route> = Object.create(null);
	private _routes: Route[] = [];
	history?: IHistory;
	private readonly _size = value(0);
	private readonly _nodes: Neep.Value<Match | undefined>[] = [];
	private readonly _matches = value<Match[]>([]);
	private readonly _hash = value('');
	private readonly _search = value('');
	private readonly _alias = value('');
	private readonly _path = value('/');
	private readonly _state = value(undefined as any);
	private readonly _params = value({} as Record<string, string>);
	private readonly _query = value({} as Record<string, any>);
	private readonly _meta = value({} as Record<string, any>);
	get size() { return this._size(); }
	get matches() { return this._matches(); }
	get alias() { return this._alias(); }
	get path(): string { return this._path(); }
	get search() { return this._search(); }
	get hash() { return this._hash(); }
	get state() { return this._state(); }
	get params() { return this._params(); }
	get query() { return this._query(); }
	get meta() { return this._meta(); }
	constructor({History, historyOption}: {
		History?: {new(router: Router, opt?: any): IHistory }
		historyOption?: any;
	}) {
		if (History) {
			const history = new History(this, historyOption);
			this.history = history;
			history.start?.();
		}
	}
	setRoutes(routes: RouteConfig[]) {
		const named = Object.create(null);
		this._routes = routes.map(c => addRoute(c, named));
		this._namedRoutes = named;
		this._update(
			this._path(),
			this._search(),
			this._hash(),
			this._state(),
			true,
		);
	}
	_get(index: number): Match | undefined {
		const item =  this._nodes[index]?.();
		if (!item) {
			this._size();
			return undefined;
		}
		return item;
	}
	_update(path: string, search: string, hash: string, state?: any, force = false) {
		if (this._path() !== path || force) {
			const matches = [...matchRoutes(path, this._routes)];
			const last = matches[matches.length - 1] as Match | undefined;
			if (last && !last.route.components) {
				redirects.push(path);
				if (redirects.length >= 10) {
					throw new Error(
						`Too many consecutive redirect jumps: \n${
							redirects.join('\n')
						}`,
						'router',
					);
				}
				const {redirect, append} = last.route;
				try {
					if (append) {
						this.replace(`${path}/${redirect}`, state);
					} else if (redirect && redirect[0] === '/') {
						this.replace(redirect, state);
					} else {
						this.replace(`${path}/../${redirect}`, state);
					}
					return ;
				} finally {
					redirects.pop();
				}
			}
			const nodes = this._nodes;
			const nodesLength = nodes.length;
			const matchesLength = matches.length;
			const min = Math.min(matchesLength, nodesLength);
			for (let i = 0; i < min; i++) { nodes[i](matches[i]); }
			for (let i = min; i < nodesLength; i++) {
				nodes[i](undefined);
			}
			for (let i = min; i < matchesLength; i++) {
				nodes[i] = value(matches[i]);
			}
			nodes.length = matchesLength;
			this._size(matchesLength);
			this._matches(matches);
			this._path(path);
			this._alias(last?.route?.alias || '');
			this._params(last?.params || {} as any);
			this._meta(Object.assign({}, ...matches.map(m => m.route.meta)));
		}
		if (this._search() !== search) {
			this._search(search);
			this._query((this.parse || parse)(search.substr(1)));
		}
		this._hash(hash);
		this._state(state);
	}
	push(location: Location | string, state?: any) {
		const { path, search, hash } = get(
			location,
			this._namedRoutes,
			this._path(),
			this.stringify,
		);
		this.history?.push(path, search, hash, state);
		this._update(path, search, hash, state);
	}
	replace(location: Location | string, state?: any) {
		const {path, search, hash} = get(
			location,
			this._namedRoutes,
			this._path(),
			this.stringify,
		);
		this.history?.replace(path, search, hash, state);
		this._update(path, search, hash, state);
	}
	getUrl(location: Location | string) {
		const {path, search, hash} = get(
			location,
			this._namedRoutes,
			this._path(),
			this.stringify,
		);
		return `${path}${search}${hash}`;

	}
	go(index: number) {
		const it = this.history?.go(index);
		if (!it) { return; }
		this._update(...it);
	}
	back() {
		const it = this.history?.back();
		if (!it) { return; }
		this._update(...it);
	}
	forward() {
		const it = this.history?.forward();
		if (!it) { return; }
		this._update(...it);
	}
	get view() {
		const view = createShellComponent((props, ...p) =>
			RouterView({...props, router: this}, ...p), {
				name: 'Router',
			});
		Reflect.defineProperty(this, 'view', {
			value: view,
			enumerable: true,
			configurable: true,
		});
		return view;
	}
}

export default Router;
