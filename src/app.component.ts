import { Component, BaseComponent } from '../core/index';

@Component({
  selector: 'app-component',
  style: `span { color: red; }`,
  template: `
    <a href="/">Hello World</a>
    <a href="/other">Other</a>
    <router-outlet></router-outlet>
  `
})
export class Testing extends BaseComponent {
    test(name: any){
        console.log('name changed: ', name);
    }
}