import {
  Component,
  BaseComponent,
  ViewChild,
  EventEmitter,
  Output,
} from "fornaxjs";

@Component({
  selector: "app-emitting",
  template: `
    <h2>Output Decorator Testing</h2>
    <button id="clickMe">Click me!</button>
  `,
  style: `
    h1 { color: green !important; }
    p { font-family: sans-serif; }
  `,
})
export class Emitting extends BaseComponent {
  @ViewChild("#clickMe") clickMe!: HTMLButtonElement;
  @Output() buttonClicked: EventEmitter<string> = new EventEmitter();

  onInit(): void {
    this.clickMe?.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick(): void {
    console.log("Woah!");
    this.buttonClicked.emit("Woah!");
  }
}
