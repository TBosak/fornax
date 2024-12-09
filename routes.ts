import { AboutPage, HomePage } from './components/testing';
import { Route } from './core/Routing';

const routes: Route[] = [
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
];

// Attach routes to the window object or a global variable
(window as any).appRoutes = routes;