import moduleList from './moduleList';

export default function install(Neep: typeof import ('@neep/core')) {
}
for (const f of moduleList) {
	f();
}
