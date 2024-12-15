import { Router } from "@vaadin/router";
import { BaseComponent } from "./Component";
import type { Route } from "./Models";

export class RouterOutlet extends BaseComponent {
  private router: Router | null = null;

  constructor(private routes: Route[]) {
    super();
  }

  connectedCallback() {
    super.connectedCallback(); // Ensure BaseComponent's connectedCallback is called

    // Initialize the router only once
    if (!this.router) {
      this.router = new Router(this);
      this.setRoutes();
    }
  }

  private setRoutes() {
    // Map the routes to the format expected by Vaadin Router
    const input = this.routes.map((route: Route) => {
      return {
        path: route.path,
        component: route.component["selector"], // Adjusted selector retrieval
      };
    });
    this.router?.setRoutes(input);
  }

  disconnectedCallback() {
    super.disconnectedCallback(); // Ensure BaseComponent's disconnectedCallback is called
    // Optional: Clean up the router if needed
  }
}
