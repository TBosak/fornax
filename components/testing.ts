import { BaseComponent, Component } from '../src/Core';

@Component({
  selector: 'home-page',
  template: '<h1>Home Page</h1>',
})
export class HomePage extends BaseComponent {
}

// components/AboutPage.ts

@Component({
  selector: 'about-page',
  template: '<h1>About Page</h1>',
})
export class AboutPage extends BaseComponent {
  // Component logic here
}