import { create, mName, mark } from '@neep/core';
import Router from '@neep/router';
import User from './components/User';
import Info from './components/User/Info';
import Settings from './components/User/Settings';
import Home from './components/Home';
const router = new Router({
	History: Router.history.WebPath,
	historyOption: {
		base: `/test/bundle/`,
	}
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
window.router = router;
const App = create((props, context, { createElement }) =>
<Router.View router={router}/>
);

export default mark(App, mName('App'));
