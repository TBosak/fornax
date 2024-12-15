import { Subject } from "rxjs";

export class Emitter<T = any> extends Subject<T> {
  constructor(
    private target: HTMLElement,
    private eventName: string,
  ) {
    super();
  }

  emit(value: T) {
    this.next(value);
  }
}
