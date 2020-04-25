
import resolve from '@rollup/plugin-node-resolve';
export default esm => resolve({
	extensions: esm ? [
		'.esm.ts', '.esm.tsx', '.esm.mjs', '.esm.js', '.esm.jsx', '.esm.json',
		'.ts', '.tsx', '.mjs', '.js', '.jsx', '.json',
	] : [
		'.ts', '.tsx', '.mjs', '.js', '.jsx', '.json',
	],
});
