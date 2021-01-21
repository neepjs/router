import Router from '@neep/router';
import User from './components/User';
import Info from './components/User/Info';
import Settings from './components/User/Settings';
import Home from './components/Home';
const router = new Router({
	History: Router.history.WebPath,
});
router.setRoutes([
	{ path: '/', redirect: '/home' },
	{path: '/users/:id', component: User, children: [
		{path: 'info', component: Info},
		{path: 'settings', component: Settings},
	]},
	{path: '/home', component: Home},
	{ path: '*', redirect: '/home' },
]);
(window as any).router = router;
export default router.view;
