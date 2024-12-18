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

  connectedCallback() {
    this._shadow = this.attachShadow({ mode: "open" });
    this.initializeComponent();
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (typeof this.onInit === "function") {
          this.onInit();
        }
      });
    }, 0);
  }

  private async initializeComponent() {
    let globalCSS;
    if (this.__config.styleMode !== "scoped") {
      globalCSS = await globalStyles;
    }

    if (this.__config && this.__config.templateUrl) {
      fetch(this.__config.templateUrl)
        .then((response) => response.text())
        .then((template) => {
          if (this.__config.styleUrl) {
            return fetch(this.__config.styleUrl)
              .then((resp) => resp.text())
              .then((style) => {
                this.__config.style = style;
                let combinedStyles = this.__config.style || "";

                // If not scoped, prepend globalStyles, then add local after global
                if (this.__config.styleMode !== "scoped") {
                  combinedStyles = `${combinedStyles}\n${globalCSS}`;
                }

                this.__config.template = `<style>${combinedStyles}</style>${template}`;
                this.init();
              });
          } else {
            let combinedStyles = this.__config.style || "";
            if (this.__config.styleMode !== "scoped") {
              combinedStyles = `${combinedStyles}\n${globalCSS}`;
            }

            this.__config.template = `<style>${combinedStyles}</style>${template}`;
            this.init();
          }
        });
    } else if (this.__config && this.__config.template) {
      let combinedStyles = this.__config.style || "";
      if (this.__config.styleMode !== "scoped") {
        combinedStyles = `${combinedStyles}\n${globalCSS}`;
      }
      this.__config.style = combinedStyles;
      this.__config.template = `${this.__config.template}`;
      this.init();
    }
  }

  disconnectedCallback() {
    this.onDestroy();
  }

  private init(): void {
    this.template = new Template(this.__config.template!);
    this.setupReactiveProperties();
    this.render();
    // Call onInit if defined
    if (typeof (this as any).onInit === "function") {
      (this as any).onInit();
    }
  }

  private extractTemplateProperties(template: string): string[] {
    if (this.reactivePropsCache.has(template)) {
      return this.reactivePropsCache.get(template)!;
    }

    const propertyRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
    const matches = new Set<string>();

    let match;
    while ((match = propertyRegex.exec(template)) !== null) {
      matches.add(match[1]);
    }

    const props = Array.from(matches);
    this.reactivePropsCache.set(template, props);
    return props;
  }

  private setupReactiveProperties(): void {
    if (!this.__config?.template) {
      console.warn("Template not defined for this component.");
      return;
    }

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

    // Initialize the model once
    this.model = {};
    this.setModel();
  }

  // Optionally, wrap model in a Proxy if needed for deeper reactivity

  private setModel() {
    for (const key of Object.keys(this)) {
      if (typeof this[key] !== "function" && !key.startsWith("__")) {
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

  private async render() {
    if (!this._shadow) {
      console.error("Shadow root is not attached.");
      return;
    }
  
    const shadow = this._shadow;

    // Render the template into the shadow root
    const parser = Parser.sharedInstance();
    const renderResult = this.template.render(this.model, this) as [
      string,
      Binding[]
    ];
    const [templateString, bindings] = renderResult;
  
    const patchFn = parser.createPatch(templateString);
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(this.__config.style || "");
    this._shadow.adoptedStyleSheets = [sheet];
    try {
      patchFn(shadow);  
      // Attach event listeners to the host element instead of child elements
      bindings.forEach(({ eventName, handlerName }) => {
        this.addEventListener(eventName, (event: CustomEvent) => {
          const handler = (this as any)[handlerName];
          if (typeof handler === "function") {
            console.log("Event handler:", handlerName);
            console.log("Event detail:", event.detail);
            handler.call(this, event);
          } else {
            console.warn(
              `Handler '${handlerName}' is not defined in component:`,
              this
            );
          }
        });
      });
    } catch (error) {
      console.error("Render Error:", error);
    }
  }
  

  static get observedAttributes() {
    return this.inputs.map((input) => toKebabCase(input));
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const propName = toCamelCase(name);
    if (
      (this.constructor as typeof BaseComponent).inputs &&
      (this.constructor as typeof BaseComponent).inputs.includes(propName)
    ) {
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
