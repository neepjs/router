import { Component, NeepElement, Context, Auxiliary } from '@neep/core';
import * as PathToRegexp from 'path-to-regexp';

export interface RouteConfig {
	path: string;
	children?: this[];
	meta?: object;
	redirect?: string;
	append?: boolean;
	component?: Component;
	alias?: any;
	components?: Record<string, Component>;
}
export interface Route extends RouteConfig {
	meta: object;
	toPath(object: object): string;
	match(path: string): PathToRegexp.Match<any>;
};

export interface IHistory {
	start?(): void;
	destroy?(): void;
	push(path: string, search: string, hash: string, state?: any): void
	replace(path: string, search: string, hash: string, state?: any): void;
	go(index: number): [string, string, string, any] | undefined;
	back(): [string, string, string, any] | undefined;
	forward(): [string, string, string, any] | undefined;
	link( props: { to: Location; replace?: boolean; [name: string]: any },
		context: Context,
		auxiliary: Auxiliary,
		onClick: ()=> void,
	): NeepElement;
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
