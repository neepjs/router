import Router, { Match } from '.';
declare module '@neep/core' {
	interface Context {
		readonly route?: Router;
		readonly match?: Match;
	}
	interface Delivered {
		readonly __NeepRouter__?: Router;
		readonly __RouteDepth__?: number;
	}
}