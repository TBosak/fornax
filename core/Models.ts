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
    useVite?: boolean;
  }