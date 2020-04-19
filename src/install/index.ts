import contextConstructor from './context';
import RouterView from '../View';
import RouterLink from '../Link';

export let Neep: typeof import ('@neep/core');
export default function install(neep: typeof import ('@neep/core')) {
	Neep = neep;
	Neep.addContextConstructor(contextConstructor);
	Neep.register('RouterView', RouterView);
	Neep.register('router-view', RouterView);
	Neep.register('RouterLink', RouterLink);
	Neep.register('router-link', RouterLink);
}
