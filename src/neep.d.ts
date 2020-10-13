
import { Match } from './type';
import Router from './Router';
import { ViewProps } from './View';
import { LinkProps } from './Link';

declare module '@neep/core' {
	interface Context {
		readonly route?: Router;
		readonly match?: Match;
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
