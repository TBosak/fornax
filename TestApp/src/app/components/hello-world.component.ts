import { Component, BaseComponent, Emitter, Output } from 'fornax/core';

@Component({
  selector: 'hello-world',
  template: `
    <img src="assets/logo.png"/>
    <h1>Hello {{name}}!</h1>
    <p>Welcome to Fornax!</p>
    <a id="bottom-corner" href="https://github.com/TBosak/fornax">Star us on GitHub!</a>
  `,
  style: `
    img { width: 10em; margin-bottom: 2em; }
    h1 { color: blue !important; }
    p { font-family: sans-serif; }
    #bottom-corner { position: fixed; bottom: 0; right: 0; padding: 1em; background: #333; color: white; text-decoration: none; }
  `
})
export class HelloWorld extends BaseComponent {
  name = "World";
  names: string[] = ['World','GitHub', 'Reddit', 'Friends'];

  cycleNames(){
    let name = this.names.shift() as string;
    this.names.push(name);
    this.name = name;
  }
  interval: any = setInterval(() => this.cycleNames(), 2000);
}