import contextConstructor from './context';

export let Neep: typeof import ('@neep/core');
export default function install(neep: typeof import ('@neep/core')) {
	Neep = neep;
	Neep.addContextConstructor(contextConstructor);
}