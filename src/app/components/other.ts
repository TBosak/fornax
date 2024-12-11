import { BaseComponent } from "../../../core";
import { Component } from "../../../core/Decorators";

@Component({
    selector: 'app-other',
    style: `span { color: blue; }`,
    template: `
      <div>
        <span>I'm Other!</span>
      </div>
    `
  })
  export class Other extends BaseComponent {
  }
