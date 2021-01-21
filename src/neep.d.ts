import { LinkProps, RouteContext, ViewProps } from './type';
declare module '@neep/core' {
	interface Context {
		readonly route?: RouteContext;
	}
}

declare global {
	namespace JSX {
		interface IntrinsicElements {
			RouterView: ViewProps,
			'router-view': ViewProps,
			RouterLink: LinkProps,
			'router-link': LinkProps,
		}
	}
}
