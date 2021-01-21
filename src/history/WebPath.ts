import { IHistory, IHistoryLinkProps } from '../type';
import Router from '../Router';
import { cleanPath } from '../util';
import Neep from '@neep/core';
import { createElementBase } from '../install/neep';

export default class WebPathHistory implements IHistory {
	readonly router: Router;
	readonly base: string;
	constructor(router: Router, opt?: {
		base?: string;
	}) {
		this.router = router;
		let base = cleanPath(opt?.base || '');
		this.base = base === '/' ? '' : base;
		const f = () => {
			this.router._update(
				this.getPath(),
				location.search,
				location.hash,
				history.state,
			);
		};
		window.addEventListener('popstate', f);
		this.destroy = () => {
			this.destroy = () => {};
			window.removeEventListener('popstate', f);
		};
	}
	start() {
		this.router._update(
			this.getPath(),
			location.search,
			location.hash,
			history.state,
		);
	}
	destroy() {}
	push(
		path: string,
		search: string,
		hash: string,
		state: any,
	) {
		history.pushState(state, '', `${this.base}${path}${search}${hash}`);
	}
	replace(
		path: string,
		search: string,
		hash: string,
		state: any,
	) {
		history.replaceState(state, '', `${this.base}${path}${search}${hash}`);
	}
	private getPath() {
		const path = location.pathname;
		const { base } = this;
		if (!base) { return path; }
		if (path.indexOf(`${base}/`) !== 0) { return path; }
		return path.substr(base.length);
	}
	go(index: number) {
		const old = {
			path: this.getPath(),
			search: location.search,
			hash: location.hash,
			state: history.state,
		};
		history.go(index);
		const path = this.getPath();
		const search = location.search;
		const hash = location.hash;
		const state = history.state;
		if (
			path !== old.path
			|| search !== old.search
			|| hash !== old.hash
			|| state !== old.state
		) {
			return [path, search, hash, state] as [string, string, string, any];
		}
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
			href: `${this.base}${this.router.getUrl(to)}`,
			'on:click': (e: MouseEvent) => {
				let cancel = !emit('click', e);
				if (e.defaultPrevented) { return; }
				e.preventDefault();
				if (cancel) { return; }
				onClick();
			},
		}, ...childNodes);
	}
}
