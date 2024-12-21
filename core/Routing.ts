import { Router } from "@vaadin/router";
import { BaseComponent } from "./BaseComponent";
import type { Route } from "./Models";
import { Component, Output } from "./Decorators";

export class RouterOutlet extends BaseComponent {
  public router: Router | null = null;

  constructor(private routes: Route[]) {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.router) {
      this.router = new Router(this);
      this.setRoutes();
    }
  }

  private setRoutes() {
    const input = this.routes.map((route) => ({
      path: route.path,
      action: (context, commands) => {
        // Create the component via Vaadin Router
        let component = new route.component();
        const element = commands.component(component["__config"]["selector"]);

        // Now set your params
        element["params"] = context.params;

        // Return the newly created element to the router
        return element;
      },
    }));

    this.router?.setRoutes(input);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }
}

export function addRouter(selector: string, routes: any[]) {
  @Component({
    selector,
    template: `<slot></slot>`,
  })
  class DynamicRouterOutlet extends RouterOutlet {
    constructor() {
      super(routes);
    }
  }
  return DynamicRouterOutlet;
}
