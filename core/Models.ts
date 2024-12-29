import type { BunPlugin } from "bun";
import { BaseComponent } from "./BaseComponent";
import type { Commands } from "@vaadin/router";
import { Observable, BehaviorSubject, switchMap, interval, map } from "rxjs";
import type { Context } from "../server";

export interface Binding {
  eventName: string;
  handlerName: string;
}

export interface Route {
  path: string;
  component: typeof BaseComponent;
  canActivate?: GuardFn | GuardFn[];
}

export type GuardFn = (
  context: any,
  commands: Commands
) => boolean | Promise<boolean>;

export interface FornaxConfig {
  Client: {
    srcDir: string;
    distDir: string;
    port: number;
    plugins: BunPlugin[];
    entryPoints: string[];
    alternateStyleLoader?: BunPlugin;
  };
  Server: {
    dir: string;
    port: number;
    cors?: {
      origin:
        | string
        | string[]
        | ((origin: string, c: Context) => string | undefined | null);
      allowMethods?: string[];
      allowHeaders?: string[];
      maxAge?: number;
      credentials?: boolean;
      exposeHeaders?: string[];
    };
  };
}

export class ComponentConfig {
  selector: string;
  templateUrl?: string;
  styleUrl?: string;
  style?: string;
  template?: string;
  styleMode?: "scoped" | "global" = "global";
}

export interface ServiceOptions {
  singleton?: boolean;
}

//TEST FUNCTIONALITY
export class Loop<T> extends Observable<T> {
  private subject: BehaviorSubject<T>;
  private items$: BehaviorSubject<T[]>;
  private rate$: BehaviorSubject<number>;

  constructor(items: T[], rate: number) {
    const subject = new BehaviorSubject<T>(items[0]);
    const items$ = new BehaviorSubject<T[]>(items);
    const rate$ = new BehaviorSubject<number>(rate);

    super((subscriber) => {
      subject.asObservable().subscribe(subscriber); // Connect the observable
    });

    items$
      .pipe(
        switchMap((items) =>
          rate$.pipe(
            switchMap((rate) =>
              interval(rate).pipe(map((index) => items[index % items.length]))
            )
          )
        )
      )
      .subscribe(subject);

    this.subject = subject;
    this.items$ = items$;
    this.rate$ = rate$;
  }

  add(item: T) {
    const updatedItems = [...this.items$.getValue(), item];
    this.items$.next(updatedItems);
  }

  remove(item: T) {
    const updatedItems = this.items$.getValue().filter((i) => i !== item);
    this.items$.next(updatedItems);
  }

  setRate(newRate: number) {
    this.rate$.next(newRate);
  }

  stop() {
    this.subject.complete();
    this.items$.complete();
    this.rate$.complete();
  }
}

//TEST FUNCTIONALITY
export class ReactiveArray<T> extends Observable<T[]> {
  private array$: BehaviorSubject<T[]>;

  constructor(initialArray: T[] = []) {
    const array$ = new BehaviorSubject<T[]>(initialArray);
    super((subscriber) => {
      array$.asObservable().subscribe(subscriber);
    });
    this.array$ = array$;
  }

  add(item: T) {
    const updated = [...this.array$.getValue(), item];
    this.array$.next(updated);
  }

  remove(item: T) {
    const updated = this.array$.getValue().filter((i) => i !== item);
    this.array$.next(updated);
  }

  update(index: number, item: T) {
    const updated = [...this.array$.getValue()];
    updated[index] = item;
    this.array$.next(updated);
  }
}
