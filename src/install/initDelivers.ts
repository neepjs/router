import Neep from '@neep/core';
import { createDeliverComponent } from './neep';
import Router from '../Router';

export interface RouterDeliver {
	router: Router;
	depth: number;
}
export let RouterDeliver: Neep.DeliverComponent<RouterDeliver | undefined>;

export default function initDelivers() {
	RouterDeliver = createDeliverComponent<RouterDeliver>();
}
