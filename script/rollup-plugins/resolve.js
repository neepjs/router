
import resolve from 'rollup-plugin-node-resolve';
export default () => resolve({
	extensions: [
		'.mjs', '.js', '.jsx', '.json', '.ts', '.tsx',
	],
});
