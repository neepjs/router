import Neep from '@neep/core';
import { IHistory, IHistoryLinkProps } from '../types';
import Router from '../Router';
import { createElementBase } from '../install/neep';

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
		};
		window.addEventListener('hashchange', f);
		this.destroy = () => {
			this.destroy = () => {};
			window.removeEventListener('hashchange', f);
		};
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
		{ to, ...props }: IHistoryLinkProps,
		{ childNodes, emit }: Neep.ShellContext<any>,
		onClick: ()=> void,
	) {
		return createElementBase('a', {
			...props,
			href: `#${this.router.getUrl(to)}`,
			'on:click': (e: MouseEvent) => {
				let cancel = !emit('click', e);
				if (e.defaultPrevented) { return; }
				e.preventDefault();
				if (cancel) { return; }
				onClick();
			},
		}, ...childNodes());
	}
}
