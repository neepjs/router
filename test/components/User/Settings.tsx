import { create, mark, mName } from '@neep/core';

const Settings = create((
	props: { a?: any,  set?: () => void},
	{ slots, delivered, route },
	{ Template, Slot, createElement, useValue }
) => {
	return <Template>
		<div>用户设置</div>
		<div>Id: {route?.params?.['id']}</div>
	</Template>;
});
export default mark(Settings, mName('UserSettings'));
