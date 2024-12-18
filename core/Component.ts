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

    let combinedStyles = this.__config.style || "";
    if (this.__config.styleMode !== "scoped") {
      combinedStyles = `${combinedStyles}\n${globalCSS}`;
    }

    if (this.__config.template) {
      this.__config.style = combinedStyles;
      this.__config.template = `<style>${combinedStyles}</style>${this.__config.template}`;
      this.init();
    } else {
      console.warn("Template is not defined for the component.");
    }
  }

  disconnectedCallback() {
    this.onDestroy();
  }

  private init(): void {
    this.template = new Template(this.__config.template!);
    this.setupReactiveProperties();
    this.render();
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
      bindings.forEach(({ eventName, handlerName }) => {
        this.addEventListener(eventName, (event: CustomEvent) => {
          const handler = (this as any)[handlerName];
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
