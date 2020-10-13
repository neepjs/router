import { Context } from '@neep/core';
import { addContextConstructor } from './neep';
import { RouterDeliver } from './initDelivers';

export function contextConstructor(context: Context) {
	const data = context.delivered(RouterDeliver);
	if (!data) { return; }
	const {router, depth} = data;
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

export default function installContextConstructor() {
	addContextConstructor(contextConstructor);
}
