import { LinkProps } from './types';
import { createElementBase, createShellComponent } from './install/neep';
import { withRouter } from './install';


export default createShellComponent<LinkProps, any>(function RouterLink(props) {
	const route = withRouter();
	if (!route) { return createElementBase('template'); }
	let {to, append, replace, path, search, hash, query, alias, params} = props;
	if (!to) {
		to = { path, search, hash, query, alias, params };
	} else if (typeof to === 'string') {
		to = { path: to };
	}
	if (append) {
		to.append = true;
	}
	if (replace) {
		route.replace(to);
	} else {
		route.push(to);
	}
	return createElementBase('template');;

}, {name: 'RouterRedirect'});
