import { ensureObject, makeSafeObject } from "./Utilities";

export class Template {
  public source: string | Function | null = null;
  public render: (data?: any) => string | null = null;

  static createPartial(str: string | Function) {
    if (typeof str === 'string') {
      str = str.replace(new RegExp('`', 'g'), '\\`');
    }

    return (data?: any, scope?: any): string => {
      data = ensureObject(data);
      scope = scope || this;

      let wrap: string | Function = str;
      let headerVars = Object
        .keys(data)
        .map(key => {
          const value = makeSafeObject(data[key]);
          return `${key} = ${value}`;
        });

      const header = headerVars.length ? `var ${headerVars.join(', ')};` : '';

      if (typeof str === 'string') {
        str = str.replace(/`/g, '\\`');
        str = str.replace(/\{\{\s*([^}]+)\s*\}\}/g, '${$1}');
      }

      if (typeof wrap !== 'function') {
        wrap = new Function('data', `'use strict'; ${header} return \`${str}\``);
      }

      const src = `'use strict'; return wrap.call(this, data);`;
      const fn = new Function('data', 'wrap', src);
      return String(fn.call(scope, data, wrap) || '');
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
