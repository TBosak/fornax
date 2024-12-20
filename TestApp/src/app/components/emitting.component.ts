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
  @Output() buttonClicked!: EventEmitter<string>;
  txtHidden = false;
  listOfItems = ["Item 1", "Item 2", "Item 3"];

  onInit(): void {
    this.clickMe?.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick(): void {
    this.txtHidden = !this.txtHidden;
    console.log("Woah!");
    this.buttonClicked.emit("Woah!");
  }
}
