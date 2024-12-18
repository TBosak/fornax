import {
  Component,
  BaseComponent,
  ViewChild,
  EventEmitter,
  Output,
} from "fornaxjs";
import html from "./emitting.component.html" with { type: "text" };
import styles from "./emitting.component.css";

@Component({
  selector: "app-emitting",
  template: html,
  style: styles,
})
export class Emitting extends BaseComponent {
  @ViewChild("#clickMe") clickMe!: HTMLButtonElement;
  @Output() buttonClicked: EventEmitter<string> = new EventEmitter();

  onInit(): void {
    this.clickMe?.addEventListener("click", this.handleClick.bind(this));
    console.log(this.clickMe);
  }

  handleClick(): void {
    console.log("Woah!");
    this.buttonClicked.emit("Woah!");
  }
}
