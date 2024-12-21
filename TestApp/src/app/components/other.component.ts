import { Component, BaseComponent } from "fornaxjs";
// prettier-ignore
@Component({
  selector: "app-other",
  template: `
    <h1>Other Page</h1>
    <p>This is the other page, accessible at "/other".</p>
    <app-emitting (buttonClicked)="logClick"></app-emitting>
  `,
  style: `
    h1 { color: green !important; }
    p { font-family: sans-serif; }
  `,
})
export class Other extends BaseComponent {
  logClick(event: CustomEvent): void {
    console.log("Route params:", this.params); // Debug log
    console.log("Button clicked! Event detail:", event.detail);
  }
}
