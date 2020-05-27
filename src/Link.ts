import { Context, mName, mSimple } from '@neep/core';
import { Location } from './type';
import { createElement } from './install';

export interface LinkProps extends Location {
	to?: Location | string;
	replace?: boolean;
}
export default function RouterLink(
	props: LinkProps,
	context: Context,
) {
	const { route, childNodes } = context;
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
		.history?.link({...props, to}, context, onclick)
		|| createElement('span', {'@click': onclick}, ...childNodes);

}
mSimple(RouterLink);
mName('RouterLink', RouterLink);
