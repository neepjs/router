import Neep from '@neep/core';

export default  Neep.createComponent((
	props: { a?: any,  set?: () => void},
	{ route },
) => {
	const v = Neep.useValue(() => Math.random());
	return <Neep.Template>
		{v}
		<div>用户信息</div>
		<div>Id: {route?.params?.['id']}</div>
	</Neep.Template>;
}, { name: 'UserInfo'});
