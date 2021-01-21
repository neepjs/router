/*!
 * NeepRouter v0.1.0-alpha.5
 * (c) 2020-2021 Fierflame
 * @license MIT
 */
import Neep, { ShellComponent } from '@neep/core';
import { Match as Match$1 } from 'path-to-regexp';

declare function installNeep(Neep: typeof Neep): void;

declare class StoreHistory implements IHistory {
    router: Router;
    constructor(router: Router);
    index: number;
    history: [string, string, string, any][];
    push(path: string, search: string, hash: string, state: any): void;
    replace(path: string, search: string, hash: string, state: any): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link(props: IHistoryLinkProps, { childNodes, emit }: Neep.ShellContext<any>, onClick: () => void): Neep.Element<Neep.Tag<any>>;
}

declare class WebPathHistory implements IHistory {
    readonly router: Router;
    readonly base: string;
    constructor(router: Router, opt?: {
        base?: string;
    });
    start(): void;
    destroy(): void;
    push(path: string, search: string, hash: string, state: any): void;
    replace(path: string, search: string, hash: string, state: any): void;
    private getPath;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link({ to, ...props }: IHistoryLinkProps, { childNodes, emit }: Neep.ShellContext<any>, onClick: () => void): Neep.Element<Neep.Tag<any>>;
}

declare class WebPathHistory$1 implements IHistory {
    router: Router;
    constructor(router: Router);
    start(): void;
    destroy(): void;
    push(path: string, search: string, hash: string): void;
    replace(path: string, search: string, hash: string): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link({ to, ...props }: IHistoryLinkProps, { childNodes, emit }: Neep.ShellContext<any>, onClick: () => void): Neep.Element<Neep.Tag<any>>;
}



declare namespace history {
  export {
    StoreHistory as Memory,
    WebPathHistory as WebPath,
    WebPathHistory$1 as WebHash,
  };
}

declare class Router {
    static get history(): typeof history;
    static get install(): typeof installNeep;
    static get View(): Neep.ShellComponent<ViewProps, any>;
    static get Link(): Neep.ShellComponent<LinkProps, any>;
    stringify?(query: Record<any, any>): string;
    parse?(search: string): Record<any, any>;
    private _namedRoutes;
    private _routes;
    history?: IHistory;
    private readonly _size;
    private readonly _nodes;
    private readonly _matches;
    private readonly _hash;
    private readonly _search;
    private readonly _alias;
    private readonly _path;
    private readonly _state;
    private readonly _params;
    private readonly _query;
    private readonly _meta;
    get size(): number;
    get matches(): Match[];
    get alias(): string;
    get path(): string;
    get search(): string;
    get hash(): string;
    get state(): any;
    get params(): Record<string, string>;
    get query(): Record<string, any>;
    get meta(): Record<string, any>;
    constructor({ History, historyOption }: {
        History?: {
            new (router: Router, opt?: any): IHistory;
        };
        historyOption?: any;
    });
    setRoutes(routes: RouteConfig[]): void;
    _get(index: number): Match | undefined;
    _update(path: string, search: string, hash: string, state?: any, force?: boolean): void;
    push(location: Location | string, state?: any): void;
    replace(location: Location | string, state?: any): void;
    getUrl(location: Location | string): string;
    go(index: number): void;
    back(): void;
    forward(): void;
    get view(): Neep.ShellComponent<object, Record<string, any>>;
}

interface ViewProps {
    name?: string;
    depth?: number;
    router?: Router;
}
interface LinkProps extends Location {
    to?: Location | string;
    replace?: boolean;
    [name: string]: any;
}
interface IHistoryLinkProps extends LinkProps {
    to: Location;
}
interface RouteConfig {
    path?: string;
    children?: this[];
    meta?: object;
    redirect?: string;
    append?: boolean;
    component?: Neep.Component;
    alias?: any;
    components?: Record<string, Neep.Component>;
}
interface Route extends RouteConfig {
    path: string;
    meta: object;
    toPath(object: object): string;
    match(path: string): Match$1<any>;
}
interface RouteContext {
    readonly size: number;
    readonly matches: Match[];
    readonly match?: Match;
    readonly alias: string;
    readonly path: string;
    readonly search: string;
    readonly hash: string;
    readonly state: string;
    readonly params: Record<string, string>;
    readonly query: Record<string, any>;
    readonly meta: Record<string, any>;
    readonly router: Router;
    push(location: Location | string, state?: any): void;
    replace(location: Location | string, state?: any): void;
    getUrl(location: Location | string): string;
    go(index: number): void;
    back(): void;
    forward(): void;
}
interface IHistory {
    start?(): void;
    destroy?(): void;
    push(path: string, search: string, hash: string, state?: any): void;
    replace(path: string, search: string, hash: string, state?: any): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link(props: IHistoryLinkProps, context: Neep.ShellContext<any>, onClick: () => void): Neep.Element;
}
interface History {
    push(location: Location, state?: any): Promise<void>;
    replace(location: Location, state?: any): Promise<void>;
    go(index: number): void;
    back(): void;
    forward(): void;
}
interface Location {
    path?: string;
    search?: string;
    hash?: string;
    query?: string;
    alias?: string;
    params?: object;
    append?: boolean;
}
interface Match {
    path: string;
    params: object;
    route: Route;
}

declare module '@neep/core' {
	interface Context {
		readonly route?: RouteContext;
	}
}

declare global {
	namespace JSX {
		interface IntrinsicElements {
			RouterView: ViewProps,
			'router-view': ViewProps,
			RouterLink: LinkProps,
			'router-link': LinkProps,
		}
	}
}

declare function install(Neep: typeof Neep): void;

declare const _default: Neep.ShellComponent<ViewProps, any>;

declare const _default$1: ShellComponent<LinkProps, any>;

export default Router;
export { History, IHistory, IHistoryLinkProps, LinkProps, Location, Match, StoreHistory as Memory, Route, RouteConfig, RouteContext, _default$1 as RouterLink, _default as RouterView, ViewProps, WebPathHistory$1 as WebHash, WebPathHistory as WebPath, install };
