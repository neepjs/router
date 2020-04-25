import installContextConstructor from './installContextConstructor';
import installComponents from './installComponents';

export default function install(Neep: typeof import ('@neep/core')) {
}
installComponents();
installContextConstructor();
