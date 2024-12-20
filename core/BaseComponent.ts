import { Template } from "./Template";
import { Parser } from "./Parser";
import { toCamelCase, toKebabCase } from "./Utilities";
import { Binding, ComponentConfig } from "./Models";
import { globalStyles } from "./scripts/global-styles";

export class BaseComponent extends HTMLElement {
  __config: ComponentConfig;
  template: Template;
  model: any;
  static inputs: string[] = [];
  static outputs: string[] = [];
  private _shadow: ShadowRoot;
  private renderScheduled: boolean = false;
  private reactivePropsCache = new Map<string, string[]>();
  private observer: IntersectionObserver;
  private _isConnected = false;
  private idleCallbackId: number | null = null;

  connectedCallback() {
    this._isConnected = true;
    this._shadow = this.attachShadow({ mode: "open" });
    this.initializeComponent();

    // Observe visibility changes
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this._isConnected = entry.isIntersecting;
          if (!entry.isIntersecting) {
            cancelIdleCallback(this.idleCallbackId);
          }
        });
      },
      { threshold: 0.1 }
    );

    this.observer.observe(this);

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (typeof this.onInit === "function") {
          this.onInit();
        }
      }, 0);
    });
  }

  private async initializeComponent() {
    const globalCSS =
      this.__config.styleMode !== "scoped" ? await globalStyles : "";
    const combinedStyles =
      this.__config.styleMode === "scoped"
        ? this.__config.style
        : `${this.__config.style || ""}\n${globalCSS}`;

    if (this.__config.template) {
      this.__config.style = combinedStyles;
      this.init();
    } else {
      console.warn("Template is not defined for the component.");
    }
  }

  disconnectedCallback() {
    this._isConnected = false;

    // Cancel any pending requestIdleCallback
    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }

    if (typeof this.onDestroy === "function") {
      this.onDestroy();
    }
  }

  private init(): void {
    this.template = new Template(this.__config.template!);
    this.setupReactiveProperties();
    this.render(true);
  }

  private extractTemplateProperties(template: string): string[] {
    if (this.reactivePropsCache.has(template)) {
      return this.reactivePropsCache.get(template)!;
    }

    const propertyRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g; // Match {{ prop }}
    const ifDirectiveRegex = /\*if="([^"]+)"/g; // Match *if="condition"
    const forDirectiveRegex = /\*for="([^"]+)\s+of\s+([^"]+)"/g; // Match *for="item of collection"

    const matches = new Set<string>();

    // Extract properties from {{ }} bindings
    let match;
    while ((match = propertyRegex.exec(template)) !== null) {
      matches.add(match[1]);
    }

    // Extract properties from *if directives
    while ((match = ifDirectiveRegex.exec(template)) !== null) {
      const condition = match[1];
      const conditionProps = condition.match(/[a-zA-Z0-9_]+/g); // Extract individual properties
      if (conditionProps) {
        conditionProps.forEach((prop) => matches.add(prop));
      }
    }

    // Extract properties from *for directives
    while ((match = forDirectiveRegex.exec(template)) !== null) {
      const [, item, collection] = match;
      matches.add(item); // Add the item variable
      matches.add(collection); // Add the collection variable
    }

    const props = Array.from(matches);
    this.reactivePropsCache.set(template, props);
    return props;
  }

  private setupReactiveProperties(): void {
    if (!this.__config?.template) return;

    const reactiveProps = this.extractTemplateProperties(
      this.__config.template
    );
    const proto = Object.getPrototypeOf(this);

    reactiveProps.forEach((key) => {
      if (typeof this[key] !== "function" && !key.startsWith("__")) {
        let internalValue = this[key];

        const descriptor =
          Object.getOwnPropertyDescriptor(this, key) ||
          Object.getOwnPropertyDescriptor(proto, key);

        if (!descriptor || (!descriptor.get && !descriptor.set)) {
          Object.defineProperty(this, key, {
            get: () => internalValue,
            set: (newVal) => {
              if (internalValue !== newVal) {
                internalValue = newVal;
                this.setModel();
                this.scheduleRender();
              }
            },
            configurable: true,
            enumerable: true,
          });
        } else {
          // Respect existing getter and setter logic
          const originalGet = descriptor.get;
          const originalSet = descriptor.set;

          Object.defineProperty(this, key, {
            get: originalGet || (() => internalValue),
            set: (newVal) => {
              if (originalSet) {
                originalSet.call(this, newVal);
              } else {
                internalValue = newVal;
              }
              this.setModel();
              this.scheduleRender();
            },
            configurable: true,
            enumerable: true,
          });
        }
      }
    });

    this.model = {};
    this.setModel();
  }

  private setModel() {
    for (const key of Object.keys(this)) {
      if (typeof this[key] !== "function" && !key.startsWith("__")) {
        this.model[key] = this[key];
      }
    }
  }

  private scheduleRender(): void {
    if (!this._isConnected) return; // Prevent rendering if disconnected

    if (!this.renderScheduled) {
      this.renderScheduled = true;

      requestAnimationFrame(() => {
        // Cancel any previous idle task before scheduling a new one
        if (this.idleCallbackId !== null) {
          cancelIdleCallback(this.idleCallbackId);
        }

        this.idleCallbackId = requestIdleCallback(() => {
          this.processRender();
          this.idleCallbackId = null;
        });
      });
    }
  }

  private processRender(): void {
    if (!this._isConnected) return;
    this.render();
    this.renderScheduled = false;
  }

  private async render(initial: boolean = false): Promise<void> {
    if (!this._shadow) {
      console.error("Shadow root is not attached.");
      return;
    }

    const parser = Parser.sharedInstance();
    const renderResult = this.template.render(this.model, this) as [
      string,
      Binding[]
    ];
    const [templateString, bindings] = renderResult;

    const patchFn = parser.createPatch(templateString);

    const processChunk = () => {
      try {
        patchFn(this._shadow);
      } catch (error) {
        console.error("Error rendering component", error);
      }
    };

    // Clear `_renderComplete` before starting a new render
    if (initial) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(this.__config.style || "");
      this._shadow.adoptedStyleSheets = [sheet];
      bindings.forEach(({ eventName, handlerName }) => {
        this.addEventListener(eventName, (event) => {
          const handler = this[handlerName];
          if (typeof handler === "function") {
            handler.call(this, event);
          } else {
            console.warn(
              `Handler '${handlerName}' is not defined in component:`,
              this
            );
          }
        });
      });
    }

    processChunk();
    if (typeof this.onRenderComplete === "function") {
      this.onRenderComplete();
    }
  }

  static get observedAttributes() {
    return this.inputs.map(toKebabCase);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const propName = toCamelCase(name);
    if ((this.constructor as typeof BaseComponent).inputs.includes(propName)) {
      this[propName] = newValue;
    }
  }

  onInit(): void {}
  onDestroy(): void {}
  onRenderComplete(): void {}
}
