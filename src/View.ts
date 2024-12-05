import { EventEmitter } from 'events';
import Template from './Template';
import Parser from './Parser';

interface ModelData {
  [key: string]: any;
}

export default class View<T extends ModelData = {}> extends EventEmitter {
  public model: T;
  public template: Template;
  public domElement: HTMLElement;
  public parser: Parser;

  constructor(
    template: Template | string,
    model: T = {} as T,
    parser: Parser = new Parser()
  ) {
    super();

    if (!(template instanceof Template)) {
      template = new Template(template);
    }

    this.model = model;
    this.template = template;
    this.parser = parser;

    const domNode = this.createElementFromHTML(this.template.render(this.model));

    if (domNode instanceof HTMLElement) {
      this.domElement = domNode;
    } else {
      throw new Error('Template did not render an HTMLElement');
    }
  }

  private createElementFromHTML(html: string): HTMLElement {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    const element = template.content.firstElementChild;
    if (element instanceof HTMLElement) {
      return element;
    } else {
      throw new Error('HTML string did not produce a valid HTMLElement');
    }
  }

  public render(parentDomElement: Element = document.body): this {
    if (!parentDomElement.contains(this.domElement)) {
      parentDomElement.appendChild(this.domElement);
    }
    return this;
  }

  public update(data: Partial<T>): this {
    this.model = { ...this.model, ...data };
    const newContent = this.template.render(this.model);
    const newDomElement = this.createElementFromHTML(newContent);
    this.patch(newDomElement);
    return this;
  }

  public patch(newElement: HTMLElement): this {
    this.parser.createPatch(newElement)(this.domElement);
    return this;
  }

  public destroy(): this {
    if (this.domElement.parentElement) {
      this.domElement.parentElement.removeChild(this.domElement);
    }
    return this;
  }

  public toString(): string {
    return this.domElement.outerHTML;
  }

  public valueOf(): HTMLElement {
    return this.domElement;
  }
}