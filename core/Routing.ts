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
    const routes = this.routes.map((route) => ({
      path: route.path,
      action: async (context, commands) => {
        if (route.canActivate) {
          const guards = Array.isArray(route.canActivate)
            ? route.canActivate
            : [route.canActivate];

          for (const guard of guards) {
            const canContinue = await guard(context, commands);
            if (!canContinue) {
              return commands.prevent();
            } else if (canContinue === true) {
              continue;
            } else {
              return canContinue;
            }
          }
        }

        // If we reach here, all guards returned true (or no guards exist)
        let component = new route.component();
        const el = commands.component(component["__config"]["selector"]);
        el["params"] = context.params;
        return el;
      },
    }));

    this.router.setRoutes(routes);
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
