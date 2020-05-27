import { IHistory } from '../type';
import Router from '../Router';
import { Context } from '@neep/core';
import { createElement } from '../install';

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
		{ id, class: className, style }: any,
		{ childNodes, emit }: Context,
		onClick: ()=> void,
	) {
		return createElement('span', {
			id, class: className, style,
			'n-on': emit.omit('click'),
			'@click': (...any: any) => {
				if (!emit('click', ...any)) { return; }
				onClick();
			},
		}, ...childNodes);
	}
}
