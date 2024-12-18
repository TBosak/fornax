import * as wasm from './build/release.js';
import { BaseComponent } from "./core/Component.js";
import {
  Component,
  Input,
  Output,
  Service,
  ViewChild,
  ViewChildren,
} from "./core/Decorators";
import { EventEmitter } from "./core/EventEmitter.js";
import { RouterOutlet } from "./core/Routing.js";
import { Context } from "./core/Context.js";

export {
  BaseComponent,
  Component,
  Input,
  Output,
  ViewChild,
  ViewChildren,
  EventEmitter,
  RouterOutlet,
  Service,
  Context,
  wasm
};
