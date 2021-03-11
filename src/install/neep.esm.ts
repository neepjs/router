export let value: typeof import ('@neep/core').value;
export let isValue: typeof import ('@neep/core').isValue;

export let register: typeof import ('@neep/core').register;
export let Error: typeof import ('@neep/core').Error;
export let createElementBase: typeof import ('@neep/core').createElementBase;
export let createShellComponent: typeof import ('@neep/core').createShellComponent;
export let createDeliverComponent: typeof import ('@neep/core').createDeliverComponent;
export let createWith: typeof import ('@neep/core').createWith;
export let withDelivered: typeof import ('@neep/core').withDelivered;
export let withLabel: typeof import ('@neep/core').withLabel;

export default function installNeep(Neep: typeof import ('@neep/core').default) {
	({
		value,
		isValue,
		register,
		Error,
		createElementBase,
		createShellComponent,
		createDeliverComponent,
		createWith,
		withDelivered,
		withLabel,
	} = Neep);
}
