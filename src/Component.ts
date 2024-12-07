// BaseComponent.ts
import { Template } from "./Template";
import { Parser } from "./Parser";

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

  constructor() {
    super();
    // Initialize __config here if necessary, possibly via decorators
  }

  connectedCallback() {
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
                this.render();
              }
            : (newVal: any) => {
                internalValue = newVal;
                this.setModel();
                this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      // Create a container for incremental-dom
      const container = document.createElement('div');
      container.setAttribute('data-root', 'true');
      this.shadowRoot.appendChild(container);
    }

    const container = this.shadowRoot!.querySelector('div[data-root="true"]') as Element;

    if (!container) return;

    const parser = Parser.sharedInstance();
    const templateSource = this.template.render(this.getModel());
    const patchFn = parser.createPatch(templateSource);

    patchFn(container);
  }

  onInit(): void {
    // Optionally override this method
  }

  onDestroy(): void {
    // Optionally override this method
  }
}
