import { create, mark, mName } from '@neep/core';
import Router from '@neep/router';

const Home = create((
	props: { a?: any,  set?: () => void},
	{ slots, delivered, route },
	{ Template, Slot, createElement, useValue }
) => {
	return <Template>
		<div>首页</div>
		<hr />
		<div><Router.Link path="/">首页</Router.Link></div>
		<div><Router.Link path="/users/1">用户1</Router.Link></div>
		<div><Router.Link path="/users/1/settings">用户1设置</Router.Link></div>
		<hr />
		<Router.View />
	</Template>;
});
export default mark(Home, mName('Home'));
