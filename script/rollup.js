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

const createOutput = (format, min) => ({
	file: [
		`dist/${ info.name.replace('@', '').replace(/\/|-/g, '.') }`,
		format === 'esm' ? 'esm' : format === 'cjs' ? 'common' : '',
		min && 'min',
		'js',
	].filter(Boolean).join('.'),
	sourcemap: true,
	format,
	name,
	banner,
	globals: {
		'@neep/core': 'Neep',
	},
	exports: 'default',
});

const external = ['@neep/core'];

export default [
	{
		input: 'src/index.ts',
		output: [ createOutput('cjs') ],
		external,
		plugins: [ resolve(), babel(), replace() ],
	},
	{
		input: 'src/index.ts',
		output: [ createOutput('esm') ],
		external,
		plugins: [ resolve(), babel(), replace(true) ],
	},
	{
		input: 'src/index.ts',
		output: [ createOutput('esm', true) ],
		external,
		plugins: [ resolve(), babel(), replace(), terser() ],
	},
	{
		input: 'src/browser.ts',
		output: [ createOutput('umd') ],
		external,
		plugins: [ resolve(), babel(), replace(true) ],
	},
	{
		input: 'src/browser.ts',
		output: [ createOutput('umd', true) ],
		external,
		plugins: [ resolve(), babel(), replace(), terser() ],
	},
	{
		input: 'src/index.ts',
		output: { file: 'types.d.ts', format: 'esm', banner },
		plugins: [ dts() ],
	},
];
