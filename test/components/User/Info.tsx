import Neep from '@neep/core';
import { withRouter } from '@neep/router';

export default  Neep.createComponent((
	props: { a?: any,  set?: () => void},
) => {
	const route = withRouter();
	const v = Neep.useValue(() => Math.random());
	return <Neep.Template>
		{v}
		<div>用户信息</div>
		<div>Id: {route?.params?.['id']}</div>
	</Neep.Template>;
}, { name: 'UserInfo'});
