import { BaseComponent } from "./Component";
import { Component } from "./Decorators";

Component({
    selector: 'router-outlet',
    template: `<slot></slot>`
    })
export class RouterOutlet extends BaseComponent{
    
}