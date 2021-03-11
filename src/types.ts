import Neep from '@neep/core';
import * as PathToRegexp from 'path-to-regexp';
import Router from './Router';

export interface ViewProps {
	name?: string;
	depth?: number;
	router?: Router;
}

export interface LinkProps extends Location {
	to?: Location | string;
	replace?: boolean;
	[name: string]: any;
}
export interface IHistoryLinkProps extends LinkProps {
	to: Location;
}

export interface RouteConfig {
	path?: string;
	children?: this[];
	meta?: object;
	redirect?: string;
	append?: boolean;
	component?: Neep.Component;
	alias?: any;
	components?: Record<string, Neep.Component>;
}
export interface Route extends RouteConfig {
	path: string;
	meta: object;
	toPath(object: object): string;
	match(path: string): PathToRegexp.Match<any>;
};
export interface RouteContext {
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

export interface IHistory {
	start?(): void;
	destroy?(): void;
	push(path: string, search: string, hash: string, state?: any): void
	replace(path: string, search: string, hash: string, state?: any): void;
	go(index: number): [string, string, string, any] | undefined;
	back(): [string, string, string, any] | undefined;
	forward(): [string, string, string, any] | undefined;
	link(
		props: IHistoryLinkProps,
		context: Neep.ShellContext<any>,
		onClick: ()=> void
	): Neep.Element;
}
export interface History {
	push(location: Location, state?: any): Promise<void>;
	replace(location: Location, state?: any): Promise<void>;
	go(index: number): void;
	back(): void;
	forward(): void;
}
export interface Location {
	path?: string;
	search?: string;
	hash?: string;
	query?: string;
	alias?: string;
	params?: object;
	append?: boolean;
}
export interface Match {
	path: string;
	params: object;
	route: Route;
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
