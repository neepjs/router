import { create, mark, mName } from '@neep/core';

const Info = create((
	props: { a?: any,  set?: () => void},
	{ slots, delivered, route },
	{ Template, Slot, createElement, useValue }
) => {
	const v = useValue(() => Math.random());
	return <Template>
		<div>用户信息</div>
		<div>Id: {route?.params?.['id']}</div>
	</Template>;
});
export default mark(Info, mName('UserInfo'));
