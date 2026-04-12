import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';

export const routes: Routes = [
	{
		path: '',
		component: Home,
	},
	{
		path: 'about',
		component: About,
	},
	/*
	{
		path: 'streaming',
		component: Streaming,
	},
	{
		path: 'gallery',
		component: Gallery,
	},
	{
		path: 'oc',
		component: OC,
	},
	{
		path: 'contact',
		component: Contact,
	},
	{
		path: 'commission',
		component: Commission,
	},
	{
		path: 'reviews',
		component: Reviews,
	}
	*/
];
