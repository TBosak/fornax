import { Component, BaseComponent } from "fornax/core";

@Component({
  selector: "app-other",
  template: `
    <h1>Other Page</h1>
    <p>This is the other page, accessible at "/other".</p>
  `,
  style: `
    h1 { color: green !important; }
    p { font-family: sans-serif; }
  `,
})
export class Other extends BaseComponent {}
