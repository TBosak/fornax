import * as wasm from "./build/release.js";
import { BaseComponent } from "./core/BaseComponent";
import {
  Component,
  Input,
  Output,
  Service,
  ViewChild,
  ViewChildren,
} from "./core/Decorators";
import { EventEmitter } from "./core/EventEmitter";
import { RouterOutlet, addRouter } from "./core/Routing";
import { Context } from "./core/Context";
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
  wasm,
  addRouter,
};
