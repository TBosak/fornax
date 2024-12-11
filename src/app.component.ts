import { Component, BaseComponent } from '../core/index';

@Component({
  selector: 'app-component',
  style: `span { color: red; }`,
  template: `
    <hello-world (nameChange)="test"></hello-world>
  `
})
export class Testing extends BaseComponent {
    test(name: any){
        console.log('name changed: ', name);
    }
}