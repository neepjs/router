import {
	createWith,
	withDelivered,
} from './neep';
import { RouterDeliver } from './initDelivers';
import Router from '../Router';
import { Match, RouteContext } from '../types';


export function createRouteContext(router: Router, depth: number): RouteContext {
	return {
		get size(): number { return router.size; },
		get matches(): Match[] { return router.matches; },
		get match(): Match | undefined { return router._get(depth); },
		get alias(): string { return router.alias; },
		get path(): string { return router.path; },
		get search(): string { return router.search; },
		get hash(): string { return router.hash; },
		get state(): string { return router.state; },
		get params(): Record<string, string> { return router.params; },
		get query(): Record<string, any> { return router.query; },
		get meta(): Record<string, any> { return router.meta; },
		get router() { return router ; },
		push(location: Location | string, state?: any): void {
			return router.push(location, state);
		},
		replace(location: Location | string, state?: any): void {
			return router.replace(location, state);
		},
		getUrl(location: Location | string): string {
			return router.getUrl(location);
		},
		go(index: number): void {
			return router.go(index);
		},
		back(): void {
			return router.back();
		},
		forward(): void {
			return router.forward();
		},
	};
}

export let withRouter: (() => RouteContext | undefined);
export default function init() {
	withRouter = createWith({
		name: 'withRouter',
		create() {
			const data = withDelivered(RouterDeliver);
			if (!data) { return; }
			const {router, depth} = data;
			return createRouteContext(router, depth);
		},
	});
}
