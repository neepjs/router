import { create, mark, mName, createElement, Template } from '@neep/core';
import Router from '@neep/router';

const User = create((
	props: { a?: any,  set?: () => void},
	{ route },
) => {
	return <Template>
		<div>用户首页</div>
		<div>Id: {route?.params?.['id']}</div>
		<hr />
		<div><Router.Link path="/">首页</Router.Link></div>
		<div><Router.Link path="/users/1">用户1</Router.Link></div>
		<div><Router.Link path="/users/2">用户2</Router.Link></div>
		<div><Router.Link path="/users/1/info">用户1信息</Router.Link></div>
		<div><Router.Link path="/users/1/settings">用户1设置</Router.Link></div>
		<hr />
		<Router.View />
	</Template>;
});
export default mark(User, mName('User'));
