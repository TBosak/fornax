import { Component, BaseComponent } from '../core/index';

@Component({
  selector: 'hello-world',
  style: `span { color: red; }`,
  template: `
    <div>
      <span>Hello, {{this.getName()}}!</span>
    </div>
  `
})
class HelloWorld extends BaseComponent {
  name: string = 'World';
  getName(){
    return this.name;
  }
}