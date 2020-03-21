import { IHistory, Location } from '../type';
import Router from '../Router';
import { Context, Auxiliary } from '@neep/core';

function parse(p: string): [string, string, string] {
	const result = /^([^?#]*)((?:\?[^#]*)?)((?:#.*)?)$/.exec(p);
	if (!result) { return ['/', '', '']; }
	return [result[1] || '/', result[2], result[3]];
}

export default class WebPathHistory implements IHistory {
	router: Router;
	constructor(router: Router) {
		this.router = router;
		const f = () => {
			const [path, search, hash] = parse(location.hash.substr(1));
			this.router._update(path, search, hash);
		}
		window.addEventListener('hashchange', f);
		this.destroy = () => {
			this.destroy = () => {};
			window.removeEventListener('hashchange', f);
		}
	}
	start() {
		const [path, search, hash] = parse(location.hash.substr(1));
		this.router._update(path, search, hash);
	}
	destroy() {}
	push(path: string, search: string, hash: string) {
		location.hash = `#${path}${search}${hash}`;
	}
	replace(path: string, search: string, hash: string) {
		location.replace(`#${path}${search}${hash}`);
	}
	go(index: number) {
		const oldHash = location.hash;
		history.go(index);
		const hash = location.hash;
		if (hash === oldHash) { return; }
		return [...parse(hash.substr(1)), undefined] as [string, string, string, any];
	}
	back() {
		return this.go(-1);
	}
	forward() {
		return this.go(1);
	}
	link(
		{to}: { to: Location },
		{ childNodes }: Context,
		{createElement}: Auxiliary,
		onClick: ()=> void,
	) {
		return createElement('a', {
			href: `#${this.router.getUrl(to)}`,
			onClick: (e: MouseEvent) => {
				e.preventDefault(); onClick();
			}
		}, ...childNodes);
	}
}