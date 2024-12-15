
import { RouterOutlet, Component } from 'fornax/core';
import { HelloWorld } from './app/components/hello-world.component';
import { Other } from './app/components/other.component';

export const routes: any[] = [
  { path: '/', component: HelloWorld },
  { path: '/other', component: Other },
];

@Component({
  selector: 'router-outlet',
  template: `<slot></slot>`
})
export class AppRouterOutlet extends RouterOutlet {
  constructor() {
    super(routes);
  }
};