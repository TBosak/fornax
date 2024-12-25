import { EventEmitter } from "./EventEmitter";
import { ComponentConfig } from "./Models";
import { Context } from "./Context";
import "reflect-metadata";
import { defineProperty, Route } from "./Utilities";
import {
  controllerRegistry,
  metadataRegistry,
  modelRegistry,
  openAPIRegistry,
} from "./scripts/constants";
import { z } from "@hono/zod-openapi";
import { ControllerBase } from "./ControllerBase";

//Client Decorators

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
          `Cannot overwrite @Output property '${String(propertyKey)}'.`
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
          `@ViewChild: Element with selector '${selector}' not found. Retrying...`
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
          `@ViewChild: Element with selector '${selector}' not found. Retrying...`
        );
        requestAnimationFrame(attemptToFindElement);
      };

      // Defer query until the next frame
      requestAnimationFrame(attemptToFindElement);
    };
  };
}

// Server Decorators
export const Get = (path: string, schemas: any, responseSchema: any) =>
  Route("get", path, schemas, responseSchema);
export const Post = (path: string, schemas: any, responseSchema: any) =>
  Route("post", path, schemas, responseSchema);
export const Put = (path: string, schemas: any, responseSchema: any) =>
  Route("put", path, schemas, responseSchema);
export const Delete = (path: string, schemas: any, responseSchema: any) =>
  Route("delete", path, schemas, responseSchema);

export function Controller(basePath: string) {
  return function (constructor: { new (): ControllerBase }) {
    const instance = new constructor();
    if (!(instance instanceof ControllerBase)) {
      throw new Error("Controllers must extend ControllerBase");
    }
    controllerRegistry.set(basePath, instance);
  };
}

export function Model() {
  return function (constructor: Function) {
    const className = constructor.name;
    const properties = metadataRegistry.get(className) || {};

    const zodShape: Record<string, any> = {};
    Object.entries(properties).forEach(([key, value]) => {
      const { type, openapi } = value;

      if (type.openapi && typeof type.openapi === "function") {
        zodShape[key] = type.openapi({
          ...openapi,
          description: openapi?.description || `Property ${key}`,
          example: openapi?.example || null,
        });
      } else {
        console.warn(`Property "${key}" is missing openapi support.`);
      }
    });

    const schema = z.object(zodShape).openapi(className, {
      title: className,
      description: `Schema for ${className}`,
    });

    openAPIRegistry.register(className, schema);
    modelRegistry.set(className, { schema });
  };
}

//TEST FUNCTIONALITY
export function Middleware(middleware: (ctx: any, next: Function) => void) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalHandler = descriptor.value;

    descriptor.value = async function (ctx: any) {
      await middleware(ctx, async () => await originalHandler.call(this, ctx));
    };
  };
}

export function Property(type: z.ZodTypeAny, openapi: any = {}) {
  return function (target: any, key: string) {
    if (!metadataRegistry.has(target)) {
      metadataRegistry.set(target, {});
    }

    const properties = metadataRegistry.get(target);
    if (!properties) return;
    properties[key] = { type, openapi };
    metadataRegistry.set(target, properties);
  };
}

export function String(openapi: any = {}) {
  return defineProperty(z.string(), openapi);
}

export function OptionalString(openapi: any = {}) {
  return defineProperty(z.string().optional(), openapi);
}

export function Number(openapi: any = {}) {
  return defineProperty(z.number(), openapi);
}

export function OptionalNumber(openapi: any = {}) {
  return defineProperty(z.number().optional(), openapi);
}

export function Boolean(openapi: any = {}) {
  return defineProperty(z.boolean(), openapi);
}

export function OptionalBoolean(openapi: any = {}) {
  return defineProperty(z.boolean().optional(), openapi);
}

export function Array(itemType: z.ZodTypeAny, openapi: any = {}) {
  return defineProperty(z.array(itemType), openapi);
}

export function OptionalArray(itemType: z.ZodTypeAny, openapi: any = {}) {
  return defineProperty(z.array(itemType).optional(), openapi);
}

export function Enum(values: [string, ...string[]], openapi: any = {}) {
  return defineProperty(z.enum(values), { ...openapi, enum: values });
}

export function OptionalEnum(values: [string, ...string[]], openapi: any = {}) {
  return defineProperty(z.enum(values).optional(), {
    ...openapi,
    enum: values,
  });
}

export function ISODate(openapi: any = {}) {
  return defineProperty(
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?$/,
        "Invalid date-time format"
      )
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    { ...openapi, format: "date-time" }
  );
}

export function OptionalISODate(openapi: any = {}) {
  return defineProperty(
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?$/,
        "Invalid date-time format"
      )
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
      .optional(),
    { ...openapi, format: "date-time" }
  );
}

export function NumberRange(min: number, max: number, openapi: any = {}) {
  return defineProperty(z.number().min(min).max(max), {
    ...openapi,
    minimum: min,
    maximum: max,
  });
}

export function OptionalNumberRange(
  min: number,
  max: number,
  openapi: any = {}
) {
  return defineProperty(z.number().min(min).max(max).optional(), {
    ...openapi,
    minimum: min,
    maximum: max,
  });
}

//TEST FUNCTIONALITY
export function Auth(
  authLogic: (ctx: any) => Promise<void> | void,
  openapi: any = { security: [{ bearerAuth: [] }] }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: any) {
      try {
        await authLogic(ctx);
        return await originalMethod.call(this, ctx);
      } catch (error: any) {
        return ctx.json(
          { error: error.message || "Unauthorized" },
          error.status || 401
        );
      }
    };

    descriptor.value.openapi = openapi;
  };
}

// General Purpose Decorators
//TEST FUNCTIONALITY
export function Memoize() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = Symbol(`__memoize_${propertyKey}`);

    descriptor.value = function (...args: any[]) {
      const instance = this as { [key: symbol]: Map<string, any> };

      if (!instance[cacheKey]) {
        instance[cacheKey] = new Map<string, any>();
      }

      const cache = instance[cacheKey];
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

const timeouts = new WeakMap<object, Map<string, Timer>>();

//TEST FUNCTIONALITY
export function Debounce(delay: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      let instanceTimeouts = timeouts.get(this);

      if (!instanceTimeouts) {
        instanceTimeouts = new Map();
        timeouts.set(this, instanceTimeouts);
      }

      if (instanceTimeouts.has(propertyKey)) {
        clearTimeout(instanceTimeouts.get(propertyKey)!);
      }

      // Set a new timeout
      const timeout = setTimeout(() => {
        originalMethod.apply(this, args);
        instanceTimeouts.delete(propertyKey);
      }, delay);

      instanceTimeouts.set(propertyKey, timeout);
    };

    return descriptor;
  };
}

//TEST FUNCTIONALITY
export function Watch(propertyKey: string) {
  return function (target: any, methodName: string) {
    const privateKey = `__${propertyKey}`;

    const originalDescriptor =
      Object.getOwnPropertyDescriptor(target, propertyKey) || {};

    Object.defineProperty(target, propertyKey, {
      get() {
        if (!Object.prototype.hasOwnProperty.call(this, privateKey)) {
          this[privateKey] = originalDescriptor.value ?? undefined;
        }

        if (originalDescriptor.get) {
          return originalDescriptor.get.call(this);
        }
        return this[privateKey];
      },
      set(value: any) {
        const oldValue = this[propertyKey];

        if (originalDescriptor.set) {
          originalDescriptor.set.call(this, value);
        } else {
          this[privateKey] = value;
        }

        if (oldValue !== value) {
          this[methodName]();
        }
      },
      configurable: true,
      enumerable: true,
    });
  };
}
