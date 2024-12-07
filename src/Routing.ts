// export interface Route {
//     path: string;
//     component: CustomElementConstructor;
//   }

//   export class Router extends HTMLElement {
//     private currentPath: string = '/';
  
//     constructor() {
//       super();
//       this.attachShadow({ mode: 'open' });
//     }
  
//     connectedCallback() {
//       // Initial render
//       this.currentPath = window.location.pathname;
//       this.render(this.currentPath);
  
//       // Listen for popstate events (back/forward navigation)
//       window.addEventListener('popstate', this.onPopState.bind(this));
  
//       // Delegate link clicks
//       document.body.addEventListener('click', this.onLinkClick.bind(this));
  
//       // Listen for custom navigate events
//       this.addEventListener('navigate' as any, this.onNavigate.bind(this));
//     }
  
//     disconnectedCallback() {
//       window.removeEventListener('popstate', this.onPopState.bind(this));
//       document.body.removeEventListener('click', this.onLinkClick.bind(this));
//       this.removeEventListener('navigate' as any, this.onNavigate.bind(this));
//     }
  
//     private onPopState(event: PopStateEvent) {
//       this.currentPath = window.location.pathname;
//       this.render(this.currentPath);
//     }
  
//     private onLinkClick(event: MouseEvent) {
//       const target = event.target as HTMLElement;
  
//       if (target.tagName === 'A') {
//         const anchor = target as HTMLAnchorElement;
//         const href = anchor.getAttribute('href');
  
//         // Check if the link is internal
//         if (href && href.startsWith('/')) {
//           event.preventDefault();
//           this.navigateTo(href);
//         }
//       }
//     }
  
//     private onNavigate(event: CustomEvent) {
//       const path = event.detail.path;
//       this.navigateTo(path);
//     }
  
//     public navigateTo(path: string) {
//       console.log((window as any).appRoutes);
//       if (path === this.currentPath) return; // Prevent redundant navigation
  
//       history.pushState({}, '', path);
//       this.currentPath = path;
//       this.render(this.currentPath);
//     }
  
//     public render(path: string) {
//       const route = this.matchRoute(path);
  
//       if (route) {
//         // Clear previous content
//         this.shadowRoot!.innerHTML = '';
  
//         // Create the component
//         const html = new route.component();
//         this.shadowRoot!.appendChild(html);
//       } else {
//         // If no route matches, render NotFound component
//         this.shadowRoot!.innerHTML = '';
//         const notFound = document.createElement('not-found-page');
//         this.shadowRoot!.appendChild(notFound);
//       }
//     }
  
//     private matchRoute(path: string): Route | null {
//       for (const route of  (window as any).appRoutes) {
//         const routePathParts = route.path.split('/').filter(Boolean);
//         const pathParts = path.split('/').filter(Boolean);
  
//         if (routePathParts.length !== pathParts.length) {
//           continue;
//         }
  
//         let isMatch = true;
//         const params: { [key: string]: string } = {};
  
//         for (let i = 0; i < routePathParts.length; i++) {
//           const routePart = routePathParts[i];
//           const pathPart = pathParts[i];
  
//           if (routePart.startsWith(':')) {
//             const paramName = routePart.slice(1);
//             params[paramName] = pathPart;
//           } else if (routePart !== pathPart) {
//             isMatch = false;
//             break;
//           }
//         }
  
//         if (isMatch) {
//           // If the route has dynamic segments, you can pass params to the component
//           // For simplicity, we're not handling params here
//           return route;
//         }
//       }
  
//       return null;
//     }
//   }
  
//   // Define the custom element
//   window.customElements.define('app-router', Router);