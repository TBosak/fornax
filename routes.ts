
import { Route } from './core/Routing';
import { HelloWorld } from './src/app/components/hello-world';
import { Other } from './src/app/components/other';

export const routes: Route[] = [
  { path: '/', component: HelloWorld },
  { path: '/other', component: Other },
];