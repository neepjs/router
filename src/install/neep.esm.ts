export let value: typeof import ('@neep/core').value;
export let encase: typeof import ('@neep/core').encase;
export let register: typeof import ('@neep/core').register;
export let Error: typeof import ('@neep/core').Error;
export let label: typeof import ('@neep/core').label;
export let createElement: typeof import ('@neep/core').createElement;
export let createDeliver: typeof import ('@neep/core').createDeliver;

export let addContextConstructor: typeof import ('@neep/core').addContextConstructor;
export default function installNeep(Neep: typeof import ('@neep/core')) {
	({
		value,
		encase,
		register,
		Error,
		label,
		createElement,
		createDeliver,
		addContextConstructor,
	} = Neep);
}
