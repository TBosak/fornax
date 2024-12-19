import { Binding } from "./Models";
import { ensureObject, makeSafeObject } from "./Utilities";

export class Template {
  private static cache = new Map<
    string,
    (data: any, scope: any) => [string, Binding[]]
  >();

  public source: string | Function | null = null;
  public render: (data?: any, scope?: any) => [string, Binding[]] = null;

  static createPartial(
    str: string
  ): (data?: any, scope?: any) => [string, Binding[]] {
    if (typeof str !== "string") {
      throw new Error("Template source must be a string.");
    }

    // Check cache for the precompiled template
    if (Template.cache.has(str)) {
      return Template.cache.get(str)!;
    }

    // Parse bindings and preprocess the template
    const bindings: Binding[] = [];
    const preprocessedTemplate = Template.preprocessTemplate(str, bindings);

    // Compile the template into a reusable function
    const templateFunction = new Function(
      "data",
      "scope",
      "bindings",
      `'use strict'; ${preprocessedTemplate}`
    );

    const renderFunction = (data?: any, scope?: any): [string, Binding[]] => {
      data = ensureObject(data);
      scope = scope || this;
      const safeData = makeSafeObject(data);

      const renderedOutput = templateFunction(safeData, scope, bindings);
      return [renderedOutput, bindings];
    };

    // Cache the compiled template function
    Template.cache.set(str, renderFunction);
    return renderFunction;
  }

  static preprocessTemplate(template: string, bindings: Binding[]): string {
    // Escape backticks and preprocess data bindings
    let processedTemplate = template.replace(/`/g, "\\`");

    // Replace {{...}} with ${...} for data binding
    processedTemplate = processedTemplate.replace(
      /\{\{\s*([^}]+)\s*\}\}/g,
      (_, expr) => {
        return `\${data.${expr.trim()}}`;
      }
    );

    // Extract and preprocess event bindings
    processedTemplate = processedTemplate.replace(
      /\(([^)]+)\)="([^"]+)"/g,
      (_, eventName, handlerName) => {
        bindings.push({ eventName, handlerName });
        return ""; // Remove the event binding from the template string
      }
    );

    // Wrap the preprocessed template in a return statement
    return `return \`${processedTemplate}\`;`;
  }

  constructor(source: string | Function) {
    this.define(source);
  }

  define(source: string | Function): this {
    this.source = source;
    this.render = Template.createPartial(source as string);
    return this;
  }

  toString(): string {
    return String(this.source || "");
  }

  valueOf(): string | Function | null {
    return this.source;
  }
}
