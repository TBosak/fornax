import { EventEmitter } from "./EventEmitter";
import { ComponentConfig } from "./Models";
import { Context } from "./Context";

import "reflect-metadata";

export function Component(config: ComponentConfig) {
  return function <T extends { new (...args: any[]): HTMLElement }>(target: T) {
    // Create a class that extends the original target and stores the config
    const customElementClass = class extends target {
      __config = config;

      constructor(...args: any[]) {
        super(...args);
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

export function Output(eventName?: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    const actualEventName = eventName || propertyKey.toString();

    Object.defineProperty(target, propertyKey, {
      get() {
        // Lazily initialize the Subject if it doesn't already exist
        if (!this[`__${String(propertyKey)}`]) {
          const emitter = new EventEmitter<any>();
          emitter.subscribe((value: any) => {
            // Dispatch the event when the Subject emits
            const event = new CustomEvent(actualEventName, {
              detail: value,
              bubbles: true,
              composed: true, // Allow crossing shadow DOM boundaries
            });
            this.dispatchEvent(event);
          });
          this[`__${String(propertyKey)}`] = emitter;
        }
        return this[`__${String(propertyKey)}`];
      },
      set(newValue) {
        throw new Error(
          `Cannot overwrite @Output property '${String(propertyKey)}'.`,
        );
      },
      configurable: true,
      enumerable: true,
    });
  };
}

export function Service(key: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const serviceKey = key;

    // Register a factory for the service
    Context.provide(serviceKey, () => new constructor());
  };
}

export function ViewChild(selector: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    const originalConnectedCallback = target.connectedCallback;

    target.connectedCallback = function (...args: any[]) {
      if (originalConnectedCallback) {
        originalConnectedCallback.apply(this, args);
      }

      const attemptToFindElement = () => {
        const element =
          this.shadowRoot?.querySelector(selector) ||
          this.querySelector(selector);

        if (element) {
          this[propertyKey] = element; // Direct assignment
          return;
        }

        console.warn(
          `@ViewChild: Element with selector '${selector}' not found. Retrying...`,
        );
        requestAnimationFrame(attemptToFindElement);
      };

      // Defer query until the next frame
      requestAnimationFrame(attemptToFindElement);
    };
  };
}

export function ViewChildren(selector: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    const originalConnectedCallback = target.connectedCallback;

    target.connectedCallback = function (...args: any[]) {
      if (originalConnectedCallback) {
        originalConnectedCallback.apply(this, args);
      }

      const attemptToFindElement = () => {
        const element =
          this.shadowRoot?.querySelectorAll(selector) ||
          this.querySelectorAll(selector);

        if (element) {
          this[propertyKey] = element; // Direct assignment
          return;
        }

        console.warn(
          `@ViewChild: Element with selector '${selector}' not found. Retrying...`,
        );
        requestAnimationFrame(attemptToFindElement);
      };

      // Defer query until the next frame
      requestAnimationFrame(attemptToFindElement);
    };
  };
}
