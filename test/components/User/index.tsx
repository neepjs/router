import Neep from '@neep/core';
import Router, { withRouter } from '@neep/router';

const 组件 = Neep.createComponent(() => {
	return <div>这是中文组件</div>;
});
export default Neep.createComponent((
	props: { a?: any,  set?: () => void},
) => {
	const route = withRouter();
	const v = Neep.useValue(() => Math.random());
	const s = Neep.useValue(() => Neep.value(0));
	s.value++;
	return <Neep.Template>
	{s.value}: {v}
		<组件 />
		<div>用户首页</div>
		<div>Id: {route?.params?.['id']}</div>
		<hr />
		<div><Router.Link path="/">首页</Router.Link></div>
		<div><Router.Link path="/users/1">用户1</Router.Link></div>
		<div><Router.Link path="/users/2">用户2</Router.Link></div>
		<div><Router.Link path={`/users/${route?.params?.['id']}/info`}>用户{route?.params?.['id']}信息</Router.Link></div>
		<div><Router.Link path={`/users/${route?.params?.['id']}/settings`}>用户{route?.params?.['id']}设置</Router.Link></div>
		<hr />
		<Router.View />
	</Neep.Template>;
}, {name: 'User'});
