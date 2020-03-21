
import replace from 'rollup-plugin-replace';
import fsFn from 'fs';
const {
	version,
} = JSON.parse(fsFn.readFileSync('./package.json'));
export default (development) => replace({
	__VERSION__: version,
	'__MODE__': development ? 'development' : 'production',
});
