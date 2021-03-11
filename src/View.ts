import { createShellComponent, createElementBase, withLabel, withDelivered } from './install/neep';
import Router from './Router';
import { RouterDeliver } from './install/initDelivers';
import { ViewProps } from './types';


function getDepth(
	router: Router,
	def: number,
	depthProp: number | undefined,
) {
	if (typeof depthProp !== 'number') { return def; }
	if (!Number.isInteger(depthProp)) { return def; }
	if (depthProp < 0) { return router.size + depthProp; }
	return depthProp;
}

function get(props: ViewProps): RouterDeliver | null {
	const propsRouter = props.router;
	if (propsRouter instanceof Router) {
		let depth = getDepth(propsRouter, 0, props.depth);
		if (depth < 0) { return null; }
		return { router: propsRouter, depth};
	}
	const routerDeliver = withDelivered(RouterDeliver);
	if (!routerDeliver) { return null; }
	const {router} = routerDeliver;
	let depth = getDepth(router, routerDeliver.depth + 1, props.depth);
	if (depth < 0) { return null; }
	return { router, depth };

}
export default createShellComponent<ViewProps, any>(function RouterView(
	props,
	context,
) {
	const info = get(props);
	if (!info) { return null; }
	const {router} = info;
	let {depth} = info;

	const name = props.name || 'default';
	for(let match = router._get(depth); match; match = router._get(++depth)) {
		const { components } = match.route;
		if (!components) { continue; }
		if (!(name in components)) { continue; }
		const component = components[name];
		if (!component) { continue; }
		withLabel({text: `{path=${match.path}}[${name}]`, color: '#987654'});
		return createElementBase(
			RouterDeliver,
			{ value: { depth, router }},
			createElementBase(component, props),
		);
	}
	return context.childNodes() as any;
}, { name: 'RouterView'});
