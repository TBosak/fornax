import { BunPlugin } from "bun";

export interface Binding {
  eventName: string;
  handlerName: string;
}

export interface Route {
  path: string;
  component: CustomElementConstructor;
}

export interface FornaxConfig {
  srcDir: string;
  distDir: string;
  port: number;
  plugins: BunPlugin[];
  entryPoints: string[];
  alternateStyleLoader?: BunPlugin;
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
