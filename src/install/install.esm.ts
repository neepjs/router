import installNeep from './neep.esm';
import moduleList from './moduleList';

export default function install(Neep: typeof import ('@neep/core').default) {
	installNeep(Neep);
	for (const f of moduleList) {
		f();
	}
}
