import Neep from '@neep/core';

export default Neep.createComponent((
	props: { a?: any,  set?: () => void},
	{ route },
) => {
	return <Neep.Template>
		<div>用户设置</div>
		<div>Id: {route?.params?.['id']}</div>
	</Neep.Template>;
}, {name: 'UserSettings'});
