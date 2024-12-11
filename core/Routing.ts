// src/components/RouterOutlet.ts
import { Router } from "@vaadin/router";
import { BaseComponent } from "./Component";
import { Component } from "./Decorators";
import { routes } from "../routes";

export interface Route {
    path: string;
    component: CustomElementConstructor;
}

@Component({
    selector: 'router-outlet',
    template: `<slot></slot>`
})
export class RouterOutlet extends BaseComponent {
    private router: Router | null = null;

    constructor() {
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
        const input = routes.map((route: any) => {
            return { 
                path: route.path, 
                component: route.component['selector'] // Adjusted selector retrieval
            };
        });
        this.router?.setRoutes(input);
    }

    disconnectedCallback() {
        super.disconnectedCallback(); // Ensure BaseComponent's disconnectedCallback is called
        // Optional: Clean up the router if needed
    }
}
