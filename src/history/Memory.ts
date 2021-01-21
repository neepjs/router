import Neep from '@neep/core';
import { IHistory, IHistoryLinkProps } from '../type';
import Router from '../Router';
import { createElementBase } from '../install/neep';

export default class StoreHistory implements IHistory {
	router: Router;
	constructor(router: Router) {
		this.router = router;
	}
	index = 0;
	history: [string, string, string, any][] = [];
	push(
		path: string,
		search: string,
		hash: string,
		state: any,
	) {
		this.history.length = this.index + 1;
		this.index++;
		this.history.push([path, search, hash, state]);
	}
	replace(
		path: string,
		search: string,
		hash: string,
		state: any,
	) {
		this.history[this.index] = [path, search, hash, state];
	}
	go(index: number) {
		let newIndex = this.index + index;
		if (newIndex >= this.history.length) { return; }
		if (newIndex < 0) { return; }
		if (newIndex === this.index) { return; }
		this.index = newIndex;
		return this.history[newIndex];
	}
	back() {
		return this.go(-1);
	}
	forward() {
		return this.go(1);
	}
	link(
		props: IHistoryLinkProps,
		{ childNodes, emit }: Neep.ShellContext<any>,
		onClick: ()=> void,
	) {
		return createElementBase('span', {
			...props,
			'on:click': (v: any) => {
				if (!emit('click', v)) { return; }
				onClick();
			},
		}, ...childNodes);
	}
}
