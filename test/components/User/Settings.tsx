import Neep from '@neep/core';
import { withRouter } from '@neep/router';

export default Neep.createComponent((
	props: { a?: any,  set?: () => void},
) => {
	const route = withRouter();
	return <Neep.Template>
		<div>用户设置</div>
		<div>Id: {route?.params?.['id']}</div>
	</Neep.Template>;
}, {name: 'UserSettings'});
