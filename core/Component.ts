import { Template } from "./Template";
import { Parser } from "./Parser";
import { toCamelCase, toKebabCase } from "./Utilities";
import { Binding } from "./Template";

export class ComponentConfig {
  selector: string;
  templateUrl?: string;
  styleUrl?: string;
  style?: string;
  template?: string;
}

export class BaseComponent extends HTMLElement {
  __config: ComponentConfig;
  template: Template;
  model: any;
  static inputs: string[] = [];
  static outputs: string[] = [];
  private _shadow: ShadowRoot; // Private reference to the closed shadow root
  private renderScheduled: boolean = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this._shadow = this.attachShadow({ mode: 'closed' });
    this.initializeComponent();
}

private initializeComponent() {
    // Fetch and initialize template and style
    if (this.__config && this.__config.templateUrl) {
      fetch(this.__config.templateUrl)
        .then(response => response.text())
        .then(template => {
          if (this.__config.styleUrl) {
            return fetch(this.__config.styleUrl)
              .then(resp => resp.text())
              .then(style => {
                this.__config.style = style;
                this.__config.template = `<style>${this.__config.style || ''}</style>${template}`;
                this.init();
              });
          } else {
            this.__config.template = `<style>${this.__config.style || ''}</style>${template}`;
            this.init();
          }
        });
    } else if (this.__config && this.__config.template) {
      // If template is already inline, initialize directly
      this.__config.template = `<style>${this.__config.style || ''}</style>${this.__config.template}`;
      this.init();
    }
    this.onInit();
  }

  disconnectedCallback() {
    this.onDestroy();
  }

  private init(): void {
    this.template = new Template(this.__config.template!);
    this.setupReactiveProperties();
    this.render();
    // Call onInit if defined
    if (typeof (this as any).onInit === 'function') {
      (this as any).onInit();
    }
  }

  protected getModel(): object {
    // Return the proxied model
    return this.model;
  }

  private setupReactiveProperties(): void {
    const proto = Object.getPrototypeOf(this);

    for (const key of Object.keys(this)) {
      if (typeof this[key] !== 'function' && !key.startsWith('__')) {
        // Get any existing descriptor from the instance or its prototype
        let descriptor = Object.getOwnPropertyDescriptor(this, key) 
                      || Object.getOwnPropertyDescriptor(proto, key);

        let internalValue = this[key];

        if (!descriptor || (!descriptor.get && !descriptor.set)) {
          // No existing getters/setters – define them
          Object.defineProperty(this, key, {
            get: () => internalValue,
            set: (newVal) => {
              internalValue = newVal;
              this.setModel();
              this.render();
            },
            configurable: true,
            enumerable: true
          });
        } else {
          // Existing getters/setters – wrap them
          const originalGet = descriptor.get;
          const originalSet = descriptor.set;

          const getFn = originalGet || (() => internalValue);

          const setFn = originalSet 
            ? (newVal: any) => {
                originalSet.call(this, newVal);
                this.setModel();
                this.scheduleRender();
              }
            : (newVal: any) => {
                internalValue = newVal;
                this.setModel();
                this.scheduleRender();
              };

          Object.defineProperty(this, key, {
            get: getFn,
            set: setFn,
            configurable: true,
            enumerable: true
          });
        }
      }
    }

    // Initialize the model with the current properties
    this.model = {};
    this.setModel();
    }

    // Optionally, wrap model in a Proxy if needed for deeper reactivity

  private setModel(){
    for (const key of Object.keys(this)) {
      if (typeof this[key] !== 'function' && !key.startsWith('__')) {
        this.model[key] = this[key];
      }
    }
  }

  private scheduleRender(): void {
    if (!this.renderScheduled) {
        this.renderScheduled = true;
        requestAnimationFrame(() => {
            this.render();
            this.renderScheduled = false;
        });
    }
}


private render(): void {

  if (!this._shadow) {
      console.error('Shadow root is not attached.');
      return;
  }

  const shadow = this._shadow;

  // Render the template into the shadow root using incremental-dom
  const parser = Parser.sharedInstance();
  const renderResult = this.template.render(this.getModel(), this) as [string, Binding[]];
  const [templateString, bindings] = renderResult;

  const patchFn = parser.createPatch(templateString);

  try {
      patchFn(shadow);

      // Attach event listeners based on bindings
      bindings.forEach(binding => {
          const { eventName, handlerName } = binding;
          const handler = (this as any)[handlerName];
          if (typeof handler === 'function') {
              shadow.addEventListener(eventName, handler.bind(this));
              console.log(`Attached event listener for '${eventName}' to handler '${handlerName}'.`);
          } else {
              console.warn(`Handler '${handlerName}' is not a function.`);
          }
      });
  } catch (error) {
      console.error('Render Error:', error);
  }
}


  static get observedAttributes() {
    return this.inputs.map(input => toKebabCase(input));
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const propName = toCamelCase(name);
    if ((this.constructor as typeof BaseComponent).inputs && (this.constructor as typeof BaseComponent).inputs.includes(propName)) {
        (this as any)[propName] = newValue;
    }
}


  onInit(): void {
    // Optionally override this method
  }

  onDestroy(): void {
    // Optionally override this method
  }
}
