/*!
 * NeepRouter v0.1.0-alpha.0
 * (c) 2020 Fierflame
 * @license MIT
 */
import * as _mp_rt1__neep_core___NeepElement from '@neep/core';
import { Context, Auxiliary, NeepElement, Component } from '@neep/core';
import { Match as Match$1 } from 'path-to-regexp';

declare function install(neep: typeof _mp_rt1__neep_core___NeepElement): void;

declare function RouterView(props: {
    name?: string;
    depth?: number;
    router?: Router;
}, { delivered }: Context, { createElement, Deliver, label }: Auxiliary): NeepElement | null | undefined;

interface RouteConfig {
    path: string;
    children?: this[];
    meta?: object;
    redirect?: string;
    append?: boolean;
    component?: Component;
    alias?: any;
    components?: Record<string, Component>;
}
interface Route extends RouteConfig {
    meta: object;
    toPath(object: object): string;
    match(path: string): Match$1<any>;
}
interface IHistory {
    start?(): void;
    destroy?(): void;
    push(path: string, search: string, hash: string, state?: any): void;
    replace(path: string, search: string, hash: string, state?: any): void;
    go(index: number): [string, string, string, any] | undefined;
    back(): [string, string, string, any] | undefined;
    forward(): [string, string, string, any] | undefined;
    link(props: {
        to: Location;
        replace?: boolean;
        [name: string]: any;
    }, context: Context, auxiliary: Auxiliary, onClick: () => void): NeepElement;
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

declare function RouterLink(props: {
    to?: Location | string;
    replace?: boolean;
} & Location, context: Context, auxiliary: Auxiliary): NeepElement;

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
    link(props: any, { childNodes }: Context, { createElement }: Auxiliary, onClick: () => void): NeepElement;
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
    link({ to }: {
        to: Location;
    }, { childNodes }: Context, { createElement }: Auxiliary, onClick: () => void): NeepElement;
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
    link({ to }: {
        to: Location;
    }, { childNodes }: Context, { createElement }: Auxiliary, onClick: () => void): NeepElement;
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
    static get install(): typeof install;
    static get View(): typeof RouterView;
    static get Link(): typeof RouterLink;
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
    get size(): number;
    get matches(): Match[];
    get alias(): string;
    get path(): string;
    get search(): string;
    get hash(): string;
    get state(): any;
    readonly params: Record<string, string>;
    readonly query: Record<string, any>;
    readonly meta: Record<string, any>;
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
    get view(): Component<object, object>;
}

export default Router;
