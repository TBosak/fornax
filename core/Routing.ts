import { Router } from "@vaadin/router";
import { BaseComponent } from "./Component";
import { Component } from "./Decorators";
import { }
export interface Route {
    path: string;
    component: CustomElementConstructor;
}

Component({
    selector: 'router-outlet',
    template: `<slot></slot>`
    })
export class RouterOutlet extends BaseComponent{
    const router = new Router(this);

    router.setRoutes([
    ]);
}