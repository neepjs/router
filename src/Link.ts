import { LinkProps } from './type';
import { createElementBase, createShellComponent } from './install/neep';


export default createShellComponent<LinkProps, any>(function RouterLink(props, context) {
	const { route, childNodes } = context;
	if (!route) { return createElementBase('template', {}, ...childNodes); }
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
	return route.router
		.history?.link({...props, to}, context, onclick)
		|| createElementBase('span', {'on:click': onclick}, ...childNodes);

}, {name: 'RouterLink'});
