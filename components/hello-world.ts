import { Component } from '../src/Decorators';
import { BaseComponent } from '../src/Component';

@Component({
  selector: 'hello-world',
  style: `span { color: red; }`,
  template: `
    <div>
      <span>Hello, {{name}}!</span>
    </div>
  `
})
class HelloWorld extends BaseComponent {
  name: string = 'World';
  
  onInit(): void {
    setInterval(() => {
      this.name = 'Joe';
    }, 1000);
  }

}