
import replace from '@rollup/plugin-replace';
import fsFn from 'fs';
const {
	version,
} = JSON.parse(fsFn.readFileSync('./package.json'));
const constants = {
	__VERSION__: version,
};

export default prod => {
	if (typeof prod !== 'boolean') {
		return replace({
			...constants,
		});
	}
	const env = prod ? 'production' : 'development';
	return replace({
		...constants,
		'process.env.NODE_ENV': JSON.stringify(env),
	});
};
