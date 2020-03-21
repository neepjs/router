import { IHistory } from '../type';
import Router from '../Router';
import { Auxiliary, Context } from '@neep/core';

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
		props: any,
		{ childNodes }: Context,
		{ createElement }: Auxiliary,
		onClick: ()=> void,
	) {
		return createElement('span', { onClick }, ...childNodes);
	}
}