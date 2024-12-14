import { Binding } from "./Models";
import { ensureObject, makeSafeObject } from "./Utilities";

export class Template {
    public source: string | Function | null = null;
    public render: (data?: any, scope?: any) => [string, Binding[]] = null;

    static createPartial(str: string | Function) {
        let bindings: Binding[] = [];

        if (typeof str === 'string') {
            // Escape backticks to prevent template literal issues
            str = str.replace(/`/g, '\\`');
            // Replace {{...}} with ${...} for data binding
            str = str.replace(/\{\{\s*([^}]+)\s*\}\}/g, '${$1}');

            // Extract event bindings, e.g., (click)="handleClick"
            const bindingRegex = /\(([^)]+)\)="([^"]+)"/g;
            str = str.replace(bindingRegex, (match, eventName, handlerName) => {
                bindings.push({ eventName, handlerName });
                // Remove the event binding from the template string to prevent it from being rendered
                return '';
            });
        }

        return (data?: any, scope?: any): [string, Binding[]] => {
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
                // Create a new function to evaluate the template string with data and scope
                const func = new Function('safeData', 'scope', `'use strict'; ${header} return \`${str}\`;`);
                const renderedString = func.call(scope, safeData, scope);
                return [renderedString, bindings];
            }

            // If str is a function, execute it with the safeData and scope
            if (typeof str === 'function') {
                return [str.call(scope, safeData), bindings];
            }

            return ['', bindings];
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
