import { ComponentConfig } from "./Component";

export function Component(config: ComponentConfig) {
  return function<T extends { new(...args: any[]): HTMLElement }>(target: T) {
    // Create a class that extends the original target and stores the config
    const customElementClass = class extends target {
      __config = config;
      
      constructor(...args: any[]) {
        super(...args);
        // Optionally, you could do additional setup here
      }
    }

    // Define the custom element using the provided selector from config
    customElements.define(config.selector, customElementClass);

    // Return the newly extended and defined class
    return customElementClass;
  };
}
