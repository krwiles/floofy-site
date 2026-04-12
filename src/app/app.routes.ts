import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Gallery } from './gallery/gallery';
import { Reviews } from './reviews/reviews';
import { Streaming } from './streaming/streaming';
import { Contact } from './contact/contact';
import { Commission } from './commission/commission';
import { OC } from './oc/oc';

export const routes: Routes = [
	{
		path: '',
		component: Home,
	},
	{
		path: 'about',
		component: About,
	},
	{
		path: 'streaming',
		component: Streaming,
	},
	{
		path: 'gallery',
		component: Gallery,
	},
	{
		path: 'reviews',
		component: Reviews,
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
];
