import { Context, mName, mSimple } from '@neep/core';
import { createElement, label } from './install';
import Router from './Router';
import { RouterDeliver } from './install/initDelivers';

export interface ViewProps {
	name?: string;
	depth?: number;
	router?: Router;
}
export default function RouterView(
	props: ViewProps,
	{ delivered }: Context,
) {
	const isNew = props.router instanceof Router;
	const deliver = delivered(RouterDeliver) as RouterDeliver | undefined;
	const router = isNew ? props.router : deliver?.router;
	if (!(router instanceof Router)) { return; }

	let depth = props.depth;
	if (typeof depth === 'number' && Number.isInteger(depth)) {
		if (depth < 0) { depth = router.size - depth; }
	} else {
		depth = isNew ? 0 : (deliver?.depth || 0) + 1;
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
	return createElement(RouterDeliver, { value: {
		depth: depth,
		router: router,
	}}, createElement(component, props));
}
mSimple(RouterView);
mName('RouterView', RouterView);
