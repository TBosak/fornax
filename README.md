<div align="center">
  
<img width="150px" src="https://github.com/user-attachments/assets/cbe98a21-31f1-4209-af64-8a43f058f3cf">
<h1>Fornax</h1>
Fornax is a lightweight, opinionated, Angular-inspired, and Bun-powered web framework designed to simplify building single-page applications with custom components, routing, and flexible styling options.
</div>

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

Create a `fornax.config.js` in your project’s root to configure directories and ports:

```js
export default {
  srcDir: './src',
  distDir: './dist',
  port: 5000,
};
```

### Project Structure

A typical Fornax project might look like this:

```
project/
├─ src/
│  ├─ index.html
│  ├─ main.ts
│  ├─ app/
│  │  ├─ components/
│  │  │   ├─ some.component.ts
│  │  │   ├─ other.component.ts
│  │  ├─ assets/
│  ├─ routes.ts
│  ├─ app.component.ts
├─ fornax.config.js
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

## Configuring Fornax

Your `fornax.config.js` might look like this:

```js
export default {
  srcDir: './src',
  distDir: './dist',
  port: 5000,
};
```

Adjust `srcDir`, `distDir`, and `port` as needed.

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
import { SomeComponent } from './app/components/some.component';
import { OtherComponent } from './app/components/other.component';

export const routes = [
  { path: '/', component: SomeComponent },
  { path: '/other', component: OtherComponent },
];
```

In your main component (`app-component.ts`):

```typescript
@Component({
  selector: 'app-component',
  template: `
    <nav>
      <a href="/">Some Component</a>
      <a href="/other">Other Component</a>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent extends BaseComponent {}
```

~~Use client-side routing by preventing full page reloads and leveraging the `<router-outlet>` to update views dynamically.~~ (WIP to prevent full page reloads)

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
4. **Submit Pull Requests or Issues:**
   We'd love your feedback and contributions!

---

## License

Fornax is licensed under the MIT License. Feel free to use it in commercial and open-source projects.

**Happy coding with Fornax!**
  
---

## TODO:

~~Parser - LRU Caching, deterministic & hierarchal ID generation~~ <br>
~~Router - build on top of Vaadin router for now~~ & create replacement later <br>
Services - add services & Injectable decorator...should there be a base service class? <br>
Should there be a SubscriptionTracker baked into BaseComponent & we unsubscribe on disconnectedCallback? <br>
Implementing standalone components and Angular-like module system? Right now I'm just dumping everything into main. <br>
~~Set up Vite for HMR when running dev script, with Bun handling prod build or can we just achieve live reloading with Bun? - https://bun.sh/guides/read-file/watch~~<br>
Finish Output decorator and handling event binding <br>
Fix full page reloads on routing <br>
Clean up dist folder chunks on build <br>
More granular builds to avoid replacing all files in dist on every code change <br>
...
