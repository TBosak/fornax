import { Output } from '../core/Decorators';
import { Emitter } from '../core/Emitter';
import { Component, BaseComponent } from '../core/index';

@Component({
  selector: 'hello-world',
  style: `span { color: red; }`,
  template: `
    <div>
      <span>Hello, {{this.name}}!</span>
    </div>
  `
})
class HelloWorld extends BaseComponent {
  name = "World";
  @Output() nameChange: Emitter<string>;
  // getName(){
  //   return this.name;
  // }

  //list of names
  names: string[] = ['Alice', 'Bob', 'Charlie'];
  //cycle through names
  cycleNames(){
    let name = this.names.shift();
    this.names.push(name);
    this.name = name;
    this.nameChange.emit(name);
  }
  //cycle through names every 2 seconds
  interval: any = setInterval(() => this.cycleNames(), 2000);
}