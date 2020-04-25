import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import resolve from './rollup-plugins/resolve';
import babel from './rollup-plugins/babel';
import replace from './rollup-plugins/replace';
import fsFn from 'fs';
const info = JSON.parse(fsFn.readFileSync('./package.json'));
const {
	version,
	author,
	license,
} = info;

const name = info.name.replace(
	/(?:^|-|@|\/)([a-z])/g,
	(_, s) => s.toUpperCase()
);

const bYear = 2020;
const year = new Date().getFullYear();
const date = bYear === year ? bYear : `${ bYear }-${ year }`;
const banner = `\
/*!
 * ${ name } v${ version }
 * (c) ${ date } ${ author }
 * @license ${ license }
 */`;

const createOutput = (format, prod) => ({
	file: [
		`dist/${ info.name.replace('@', '').replace(/\/|-/g, '.') }`,
		...(format === 'cjs' || format === 'mjs' ? [] : [
			format === 'esm' ? 'esm' : 'browser',
			prod && 'min',
		]),
		format === 'mjs' ? 'mjs' : 'js',
	].filter(Boolean).join('.'),
	// sourcemap: true,
	format: format === 'mjs' ? 'esm' : format,
	name,
	banner,
	globals: {
		'@neep/core': 'Neep',
	},
	exports: 'default',
});

const external = ['@neep/core'];
const input = 'src/index.ts';

export default [
	{
		input,
		output: [ createOutput('cjs'), createOutput('mjs') ],
		external,
		plugins: [ resolve(), babel(), replace() ],
	},

	{
		input,
		output: [ createOutput('umd') ],
		external,
		plugins: [ resolve(), babel(), replace(false) ],
	},

	{
		input,
		output: [ createOutput('umd', true) ],
		external,
		plugins: [ resolve(), babel(), replace(true), terser() ],
	},

	{
		input,
		output: [ createOutput('esm') ],
		external,
		plugins: [ resolve(true), babel(), replace(false) ],
	},
	{
		input,
		output: [ createOutput('esm', true) ],
		external,
		plugins: [ resolve(true), babel(), replace(true), terser() ],
	},

	{
		input,
		output: { file: 'types.d.ts', format: 'esm', banner },
		plugins: [ dts() ],
	},
];
