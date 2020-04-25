export let value: typeof import ('@neep/core').value;
export let encase: typeof import ('@neep/core').encase;
export let register: typeof import ('@neep/core').register;
export let Error: typeof import ('@neep/core').Error;

export let addContextConstructor: typeof import ('@neep/core').addContextConstructor;
export default function installNeep(Neep: typeof import ('@neep/core')) {
	value = Neep.value;
	encase = Neep.encase;
	register = Neep.register;
	Error = Neep.Error;
	addContextConstructor = Neep.addContextConstructor;
}
