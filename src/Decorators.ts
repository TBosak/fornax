import Template from './Template';
import View from './View';

interface CustomElementConfig {
  selector: string;
  template?: string;
  style?: string;
  templateUrl?: string;
  styleUrl?: string;
  useShadow?: boolean;
}

export const Component = (config: CustomElementConfig) => {
  return (OriginalClass: any) => {
    // Save the original connectedCallback, if any
    const connectedCallback = OriginalClass.prototype.connectedCallback;

    OriginalClass.prototype.connectedCallback = async function () {
      // Load template and style content
      let templateContent = config.template || '';
      let styleContent = config.style || '';

      if (config.templateUrl) {
        templateContent = await loadFileContent(config.templateUrl);
      }

      if (config.styleUrl) {
        styleContent = await loadFileContent(config.styleUrl);
      }

      // Create Template instance with the template content
      const template = new Template(templateContent);

      // Create a model from the component's properties
      const model = getModelFromComponent(this);

      // Create a View instance
      const view = new View(template, model);

      // Store the view on the component instance for later use (e.g., updates)
      this.__view = view;

      // The domElement of the view will be the rendered content
      const renderedContent = view.domElement as HTMLElement;

      if (config.useShadow) {
        const shadowRoot = this.attachShadow({ mode: 'open' });

        // Insert the style content, if any
        if (styleContent) {
          const styleElement = document.createElement('style');
          styleElement.textContent = styleContent;
          shadowRoot.appendChild(styleElement);
        }

        // Append the rendered content
        shadowRoot.appendChild(renderedContent);
      } else {
        // Insert the style content, if any
        if (styleContent) {
          const styleElement = document.createElement('style');
          styleElement.textContent = styleContent;
          this.appendChild(styleElement);
        }

        // Append the rendered content
        this.appendChild(renderedContent);
      }

      // Call the original connectedCallback if it exists
      if (typeof connectedCallback === 'function') {
        connectedCallback.call(this);
      }
    };

    // Copy prototype methods (excluding constructor and connectedCallback) from OriginalClass
    Object.getOwnPropertyNames(OriginalClass.prototype).forEach((prop) => {
      if (!['constructor', 'connectedCallback'].includes(prop)) {
        Object.defineProperty(
          OriginalClass.prototype,
          prop,
          Object.getOwnPropertyDescriptor(OriginalClass.prototype, prop)!
        );
      }
    });

    // Define the custom element
    window.customElements.define(config.selector, OriginalClass);

    return OriginalClass;
  };
};

const loadFileContent = async (filePath: string = ''): Promise<string> => {
  if (!filePath) {
    return '';
  }
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${filePath}`);
  }
  return await response.text();
};

function getModelFromComponent(component: any): any {
  // Extract the component's own enumerable properties as the model
  const model: { [key: string]: any } = {};
  for (const key of Object.keys(component)) {
    if (typeof component[key] !== 'function') {
      model[key] = component[key];
    }
  }
  return model;
}
