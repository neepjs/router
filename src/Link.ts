import { Context, Auxiliary, mName, mSimple } from '@neep/core';
import { Location } from './type';

export interface LinkProps extends Location {
	to?: Location | string;
	replace?: boolean;
}
export default function RouterLink(
	props: LinkProps,
	context: Context,
	auxiliary: Auxiliary,
) {
	const { route, childNodes } = context;
	const { createElement } = auxiliary;
	if (!route) { return createElement('template', {}, ...childNodes); }
	let {to, append, replace, path, search, hash, query, alias, params} = props;
	if (!to) {
		to = { path, search, hash, query, alias, params };
	} else if (typeof to === 'string') {
		to = { path: to };
	}
	if (append) {
		to.append = true;
	}
	function onclick() {
		if (!route || !to) { return; }
		if (replace) {
			route.replace(to);
		} else {
			route.push(to);
		}
	}
	return route
		.history?.link({...props, to}, context, auxiliary, onclick)
		|| createElement('span', {onclick}, ...childNodes);

}
mSimple(RouterLink);
mName('RouterLink', RouterLink);
