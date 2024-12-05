import { BaseComponent, Component } from "../src/Core";

@Component({
  selector: 'hello-world',
  template: `<h1>Hello, World! {{name}}</h1><br/>
  <button>Go to About</button>`,
  style: 'h1 { color: red; }'
})
export class HelloWorld extends BaseComponent {
    name = 'John Doe';
  }