import { create, mark, mName, createElement, Template } from '@neep/core';

const Settings = create((
	props: { a?: any,  set?: () => void},
	{ route },
) => {
	return <Template>
		<div>用户设置</div>
		<div>Id: {route?.params?.['id']}</div>
	</Template>;
});
export default mark(Settings, mName('UserSettings'));
