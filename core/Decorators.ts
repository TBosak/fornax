import { ComponentConfig } from "./Component";
import { Emitter } from "./Emitter";
import { DependencyContainer } from "./DependencyContainer";
import "reflect-metadata";

export function Component(config: ComponentConfig) {
  return function <T extends { new (...args: any[]): HTMLElement }>(target: T) {
    // Create a class that extends the original target and stores the config
    const customElementClass = class extends target {
      __config = config;

      constructor(...args: any[]) {
        super(...args);
        // Optionally, you could do additional setup here
      }
    };

    // Define the custom element using the provided selector from config
    if (customElements.get(config.selector)) {
      // The custom element is defined
    } else {
      // The custom element is not defined
      customElements.define(config.selector, customElementClass);
    }
    target["selector"] = config.selector;
    // Return the newly extended and defined class
    return customElementClass;
  };
}

export function Input() {
  return function (target: any, propertyKey: string) {
    // Store the list of inputs on the class constructor

    if (!target.constructor.inputs) {
      target.constructor.inputs = [];
    }
    target.constructor.inputs.push(propertyKey);

    // Define getter and setter to observe property changes

    let value = target[propertyKey];

    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(newVal) {
        value = newVal;
        if (typeof target.render === "function") {
          target.scheduleRender();
        }
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export function Output() {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        if (!this[`__${propertyKey}`]) {
          this[`__${propertyKey}`] = new Emitter(target, propertyKey);
        }
        return this[`__${propertyKey}`];
      },
      set(value: Emitter) {
        this[`__${propertyKey}`] = value;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

interface ServiceOptions {
  singleton?: boolean;
}

export function Service(options?: ServiceOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Define metadata for singleton flag
    Reflect.defineMetadata(
      "singleton",
      options?.singleton ?? false,
      constructor,
    );

    if (options?.singleton) {
      const serviceName = constructor.name;
      DependencyContainer.getInstance().registerSingleton(
        constructor,
        serviceName,
      );
    }
  };
}
