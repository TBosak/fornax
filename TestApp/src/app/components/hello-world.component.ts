import { Component, BaseComponent, Context } from "fornax/core";
import { ApiService } from "../services/api.service";

@Component({
  selector: "hello-world",
  template: `
    <img src="assets/logo.png" />
    <h1>Hello {{ name }}!</h1>
    <p>{{ apiResponse }}</p>
    <a id="bottom-corner" href="https://github.com/TBosak/fornax"
      >Star us on GitHub!</a
    >
  `,
  style: `
    img { width: 10em; margin-bottom: 2em; }
    h1 { color: blue !important; }
    p { font-family: simport { const } from './../../../node_modules/bun-types/bun.d';
ans-serif; }
    #bottom-corner { position: fixed; bottom: 0; right: 0; padding: 1em; background: #333; color: white; text-decoration: none; }
  `,
})
export class HelloWorld extends BaseComponent {
  name = "World";
  apiResponse = "Loading...";
  names: string[] = ["World", "GitHub", "Reddit", "Friends"];
  interval: any = setInterval(() => this.cycleNames(), 2000);

  cycleNames() {
    let name = this.names.shift() as string;
    this.names.push(name);
    this.name = name;
  }

  onInit(): void {
    const apiService: ApiService = Context.get("ApiService");
    this.apiResponse = apiService.getData();
  }
}
