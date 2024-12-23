import { BunPlugin } from "bun";
import { BaseComponent } from "./BaseComponent";
import { Commands } from "@vaadin/router";

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

export type HttpMethod = "get" | "post" | "put" | "delete";