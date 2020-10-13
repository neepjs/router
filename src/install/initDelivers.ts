import { Deliver } from '@neep/core';
import { createDeliver } from './neep';
import Router from '../Router';

export interface RouterDeliver {
	router: Router;
	depth: number;
}
export let RouterDeliver: Deliver<RouterDeliver | undefined>;

export default function initDelivers() {
	RouterDeliver = createDeliver<RouterDeliver>();
}
