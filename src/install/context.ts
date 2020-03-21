import { Context } from '@neep/core';

export default function contextConstructor(context: Context) {
	const router = context.delivered.__NeepRouter__;
	const depth = context.delivered.__RouteDepth__ || 0;
	Reflect.defineProperty(context, 'route', {
		value: router,
		enumerable: true,
		configurable: true,
	});
	Reflect.defineProperty(context, 'match', {
		get: () => router?._get(depth),
		enumerable: true,
		configurable: true,
	});
}