import { Emitter } from "./Emitter";
import { DependencyContainer } from "./DependencyContainer";
import { ComponentConfig, ServiceOptions } from "./Models";
import "reflect-metadata";

export function Component(config: ComponentConfig) {
  return function <T extends { new (...args: any[]): HTMLElement }>(target: T) {
    // Create a class that extends the original target and stores the config
    const customElementClass = class extends target {
      __config = config;

      constructor(...args: any[]) {
        // Resolve dependencies before passing them to the original constructor
        const dependencies =
          Reflect.getMetadata("design:paramtypes", target) || [];
        const injections = dependencies.map((dep: any) =>
          DependencyContainer.getInstance().resolve(dep)
        );

        super(...injections);
      }
    };

    // Define the custom element using the provided selector from config
    if (!customElements.get(config.selector)) {
      customElements.define(config.selector, customElementClass);
    }

    // Attach selector metadata for potential future use
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

export function Service(options?: ServiceOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(
      "singleton",
      options?.singleton ?? false,
      constructor
    );

    if (options?.singleton) {
      const serviceName = constructor.name;
      DependencyContainer.getInstance().registerSingleton(
        constructor,
        serviceName
      );
    } else {
      // Ensure the service is injectable even if not singleton
      const originalConstructor = constructor;
      function InjectableService(...args: any[]) {
        const dependencies =
          Reflect.getMetadata("design:paramtypes", originalConstructor) || [];
        const injections = dependencies.map((dependency: any) =>
          DependencyContainer.getInstance().resolve(dependency)
        );
        return new originalConstructor(...injections);
      }
      InjectableService.prototype = originalConstructor.prototype;
      Reflect.defineMetadata("injectable", true, InjectableService);
      return InjectableService as unknown as T;
    }
  };
}
