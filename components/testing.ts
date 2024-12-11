import { Component, BaseComponent } from '../core/index';

@Component({
  selector: 'app-testing',
  style: `span { color: red; }`,
  template: `
    <hello-world (nameChange)="test"></hello-world>
  `
})
class Testing extends BaseComponent {
    test(name: any){
        console.log('name changed: ', name);
    }
}