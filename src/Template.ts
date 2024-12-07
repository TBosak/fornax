// Template.ts
import { ensureObject, makeSafeObject } from "./Utilities";

export class Template {
  public source: string | Function | null = null;
  public render: (data?: any) => string | null = null;

  static createPartial(str: string | Function) {
    if (typeof str === 'string') {
      // Escape backticks to prevent template literal issues
      str = str.replace(/`/g, '\\`');
      // Replace {{var}} with ${var} for template literals
      str = str.replace(/\{\{\s*([^}]+)\s*\}\}/g, '${$1}');
    }

    return (data?: any, scope?: any): string => {
      data = ensureObject(data);
      scope = scope || this;

      // Sanitize the data to prevent circular references and exclude functions
      const safeData = makeSafeObject(data);

      let headerVars = Object.keys(safeData).map(key => {
        // Declare variables corresponding to the data keys
        return `let ${key} = safeData['${key}']`;
      });

      const header = headerVars.length ? `${headerVars.join('; ')};` : '';

      if (typeof str === 'string') {
        // Create a new function to evaluate the template string with data
        return new Function('safeData', `'use strict'; ${header} return \`${str}\`;`)(safeData);
      }

      // If str is a function, execute it with the safeData
      if (typeof str === 'function') {
        return str.call(scope, safeData);
      }

      return '';
    };
  }

  constructor(source: string | Function) {
    this.define(source);
  }

  define(source: string | Function): this {
    this.source = source;
    this.render = Template.createPartial(source);
    return this;
  }

  toString(): string {
    return String(this.source || '');
  }

  valueOf(): string | Function | null {
    return this.source;
  }
}
