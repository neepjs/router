import { Context, Auxiliary, mName, mSimple } from '@neep/core';
import Router from './Router';

export interface ViewProps {
	name?: string;
	depth?: number;
	router?: Router;
}
export default function RouterView(
	props: ViewProps,
	{ delivered }: Context,
	{ createElement, Deliver, label }: Auxiliary,
) {
	const isNew = props.router instanceof Router;
	const router = isNew ? props.router : delivered.__NeepRouter__;
	if (!(router instanceof Router)) { return; }
	let depth = props.depth;
	if (typeof depth === 'number' && Number.isInteger(depth)) {
		if (depth < 0) { depth = router.size - depth; }
	} else {
		depth = isNew ? 0 : (delivered.__RouteDepth__ || 0) + 1;
	}
	if (depth < 0) { return null; }
	const match = router._get(depth);
	if (!match) { return; }
	const { route: { components } } = match;
	if (!components) { return null; }
	const name = props.name || 'default';
	const component = name in components ? components[name] : undefined;
	if (!component) { return null; }
	label(`[path=${match.path}]`, '#987654');
	return createElement(Deliver, {
		__RouteDepth__: depth,
		__NeepRouter__: router,
	}, createElement(component, props));
}
mSimple(RouterView);
mName('RouterView', RouterView);
