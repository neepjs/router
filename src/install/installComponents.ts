import RouterView from '../View';
import RouterLink from '../Link';
import { register } from './neep';

export default function installComponents() {
	register('RouterView', RouterView);
	register('router-view', RouterView);
	register('RouterLink', RouterLink);
	register('router-link', RouterLink);
}
