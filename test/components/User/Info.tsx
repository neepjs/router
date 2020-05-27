import { create, mark, mName, createElement, Template, useValue } from '@neep/core';

const Info = create((
	props: { a?: any,  set?: () => void},
	{ route },
) => {
	const v = useValue(() => Math.random());
	return <Template>
		<div>用户信息</div>
		<div>Id: {route?.params?.['id']}</div>
	</Template>;
});
export default mark(Info, mName('UserInfo'));
