import Neep from '@neep/core';
import { createShellComponent, createElementBase, label } from './install/neep';
import Router from './Router';
import { RouterDeliver } from './install/initDelivers';
import { ViewProps } from './type';


function getDepth(
	router: Router,
	def: number,
	depthProp: number | undefined,
) {
	if (typeof depthProp === 'number' && Number.isInteger(depthProp)) {
		if (depthProp < 0) {
			return router.size + depthProp;
		}
		return depthProp;
	}
	return def;
}
function get(props: ViewProps, { delivered }: Neep.ShellContext<any>): RouterDeliver | null {
	if (props.router instanceof Router) {
		const router = props.router;
		if (!(router instanceof Router)) { return null; }
		let depth = getDepth(router, 0, props.depth);
		if (depth < 0) { return null; }
		return { router, depth};
	}
	const routerDeliver = delivered(RouterDeliver);
	if (!routerDeliver) { return null; }
	const router = routerDeliver.router;
	let depth = getDepth(router, routerDeliver.depth + 1, props.depth);
	if (depth < 0) { return null; }
	return { router, depth };

}
export default createShellComponent<ViewProps, any>(function RouterView(
	props,
	context,
) {
	const info = get(props, context);
	if (!info) { return null; }
	const {router} = info;
	let {depth} = info;

	const name = props.name || 'default';
	for(let match = router._get(depth); match; match = router._get(++depth)) {
		const { components } = match.route;
		if (!components) { continue; }
		const component = name in components ? components[name] : undefined;
		if (!component) { continue; }
		label({text: `{path=${match.path}}[${name}]`, color: '#987654'});
		return createElementBase(
			RouterDeliver,
			{ value: { depth, router }},
			createElementBase(component, props),
		);
	}
	return context.childNodes as any;
}, { name: 'RouterView'});
