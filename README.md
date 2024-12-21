<div align="center">
  
<img width="150px" src="https://github.com/user-attachments/assets/cbe98a21-31f1-4209-af64-8a43f058f3cf">
<h1>Fornax</h1>
Fornax is a lightweight, opinionated, and highly customizable Bun-powered web framework designed to simplify building single-page applications with custom components, routing, and flexible styling options.
</div><br>

**Key Features:**

- **Custom Components:** Define reusable UI elements using decorators and TypeScript classes.
- **Routing Made Easy:** Leverage a `<router-outlet>` and a straightforward `routes.ts` configuration for SPA navigation.
- **Flexible Styling Modes:** Choose between scoped and global styling for your components.
- **TypeScript by Default:** Enjoy type safety and clean code with TypeScript integration.

---

## Getting Started

### Prerequisites

- **Bun:** Install Bun from [https://bun.sh/](https://bun.sh/)

### Installation

Add Fornax to your existing Bun project:

```bash
bun add fornaxjs
```

Create a `fornax.config.ts` in your project’s root to configure directories, ports, custom plugins (style-loader is included by default for css imports), and extra entry points:

```typescript
export default {
  srcDir: "./src",
  distDir: "./dist",
  port: 5000,
  plugins: [],
  entryPoints: [],
  alternateStyleLoader: null,
};
```

Adjust as needed.

### Project Structure

A typical Fornax project might look like this:

```
project/
├─ src/
│  ├─ index.html
│  ├─ routes.ts
│  ├─ app.component.ts
│  ├─ app/
│  │  ├─ components/
│  │  │   ├─ some.component.ts
│  │  │   ├─ other.component.ts
│  │  ├─ assets/
├─ fornax.config.ts
└─ main.ts
```

- `index.html`: Your application’s HTML entry point.
- `main.ts`: Dynamically generated entry that imports all components and routes.
- `routes.ts`: Defines the application’s client-side routes.
- `app/components/`: Store your custom components here.

### Running the Dev Server

```bash
fnx dev
```

This starts:

- Bun as a back-end/static server with watch mode.

### Building for Production

```bash
fnx build
```

Outputs bundled files into the `dist` directory.

### Starting the App

After building, start the server without watch mode:

```bash
fnx start
```

Open `http://localhost:5000` to view your application.

---

## Styling Modes

Fornax supports two style modes for your components:

- **Scoped:** `<style>` inside each component. Styles are encapsulated and don't leak globally.
- **Global:** Allows global styles from `index.html` to affect components.

This is configured in the Component decorator.

---

## Routing

Define routes in `routes.ts`:

```typescript
import { SomeComponent } from "./app/components/some.component";
import { OtherComponent } from "./app/components/other.component";

export const routes = [
  { path: "/", component: SomeComponent },
  { path: "/other", component: OtherComponent },
];

addRouter("some-selector", routes);
```

In your main component (`app-component.ts`):

```typescript
@Component({
  selector: "app-component",
  template: `
    <nav>
      <a href="/">Some Component</a>
      <a href="/other">Other Component</a>
    </nav>
    <some-selector></some-selector>
  `,
})
export class AppComponent extends BaseComponent {}
```

Use client-side routing by preventing full page reloads and leveraging the `<some-selector>` to update views dynamically.

---

## Components and Services

Components must extend BaseComponent and use the Component decorator (similar to Angular):

```typescript
@Component({
  selector: "selector-goes-here",
  template: `html goes here`,
  style: `style goes here`,
})
export class SomeComponent extends BaseComponent {
  onInit(): void {
    // Lifecycle hooks inherited from BaseComponent
  }

  onDestroy(): void {
    // Lifecycle hooks inherited from BaseComponent
  }
}
```

You can import html or css into your component using Bun pre-configured loaders:

```typescript
import { Component, BaseComponent } from "fornaxjs";
import html from "./some.component.html" with { type: "text" };
import styles from "./some.component.css";
@Component({
  selector: 'selector-goes-here',
  template: html
  style: styles
})
export class SomeComponent extends BaseComponent {}
```

Services are lazily instatiated and then shared in a map across components via Context:

```typescript
import { Service } from "fornaxjs";

@Service("ApiService")
export class ApiService {
  getData() {
    return "Welcome to Fornax!";
  }
}
```

```typescript
import { Component, BaseComponent, Context } from "fornaxjs";
import { ApiService } from "../services/api.service";

@Component({
  selector: "hello-world",
  template: ` <p>{{ apiResponse }}</p> `,
})
export class HelloWorld extends BaseComponent {
  apiResponse = "Loading...";

  onInit(): void {
    const apiService: ApiService = Context.get("ApiService");
    this.apiResponse = apiService.getData();
  }
}
```

Any properties of the component that are featured in the template will cause a re-render when updated:

```typescript
import { Component, BaseComponent } from "fornaxjs";

@Component({
  selector: "hello-world",
  template: ` <h1>Hello {{ name }}!</h1> `,
})
export class HelloWorld extends BaseComponent {
  name = "World";
  names: string[] = ["World", "GitHub", "Reddit", "Friends"];
  interval: any = setInterval(() => this.cycleNames(), 2000);

  cycleNames() {
    let name = this.names.shift() as string;
    this.names.push(name);
    this.name = name;
  }
}
```

---

Here’s a concise guide to the `*if` and `*for` directives for your `README.md`, including examples and usage instructions:

---

## Conditional and Iterative Rendering with `*if` and `*for`

Fornax provides powerful directives for conditionally rendering elements (`*if`) and iterating over collections (`*for`). These directives simplify dynamic UI updates while keeping your templates clean and declarative.

---

### `*if` Directive

The `*if` directive conditionally renders an element based on a boolean expression.

#### Syntax
```html
<element *if="condition">Content</element>
```

- `condition`: A boolean expression evaluated against the component's properties.

#### Example
```html
<p *if="showText">This text is visible when 'showText' is true.</p>
<p *if="!showText">This text is visible when 'showText' is false.</p>
```

#### Component Code
```typescript
@Component({...})
export class ExampleComponent extends BaseComponent {
  showText = true;

  toggleText() {
    this.showText = !this.showText;
  }
}
```

---

### `*for` Directive

The `*for` directive iterates over a collection and renders the specified element for each item.

#### Syntax
```html
<element *for="item of collection">{{ item }}</element>
```

- `item`: The loop variable representing each element in the collection.
- `collection`: The array or iterable to iterate over.

#### Example
```html
<ul>
  <li *for="item of items">{{ item }}</li>
</ul>
```

#### Component Code
```typescript
@Component({...})
export class ExampleComponent extends BaseComponent {
  items = ["Item 1", "Item 2", "Item 3"];
}
```

---

### Combined Usage

The `*if` and `*for` directives can be used together for complex rendering logic.

#### Example
```html
<ul *if="!itemsHidden">
  <li *for="item of items">{{ item }}</li>
</ul>
<p *if="itemsHidden">The items are hidden.</p>
```

#### Component Code
```typescript
@Component({...})
export class ExampleComponent extends BaseComponent {
  itemsHidden = false;
  items = ["Item 1", "Item 2", "Item 3"];

  toggleItemsVisibility() {
    this.itemsHidden = !this.itemsHidden;
  }
}
```

---

## Contributing

Fornax is a young project aiming for a simple, productive development experience in the Bun ecosystem.

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/TBosak/fornax.git
   ```
2. **Install Dependencies:**
   ```bash
   bun install
   ```
3. **Submit Pull Requests or Issues:**
   We'd love your feedback and contributions!

---

## License

Fornax is licensed under the MIT License. Feel free to use it in commercial and open-source projects.

**Happy coding with Fornax!**

---

## TODO:

~~Parser - LRU Caching, deterministic & hierarchal ID generation~~ <br>
~~Router - build on top of Vaadin router for now~~ & create replacement later <br>
~~Services - add services & Injectable decorator...should there be a base service class?~~ <br>
Should there be a SubscriptionTracker baked into BaseComponent & we unsubscribe on disconnectedCallback? <br>
Implementing standalone components and Angular-like module system? Right now I'm just dumping everything into main. <br>
~~Set up Vite for HMR when running dev script, with Bun handling prod build or can we just achieve live reloading with Bun? - https://bun.sh/guides/read-file/watch~~<br>
~~Finish Output decorator and handling event binding~~ <br>
~~Fix full page reloads on routing~~ <br>
~~Clean up dist folder chunks on build~~ <br>
~~More granular builds to avoid replacing all files in dist on every code change~~ <br>
Configure CSS minification on build <br>
SCHEMATICS <br>
...
