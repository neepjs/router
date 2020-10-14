
import babel from '@rollup/plugin-babel';
export default () => babel({
	extensions: [ '.mjs', '.js', '.jsx', '.es', '.ts', '.tsx' ],
});
