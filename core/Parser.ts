import * as parse5 from "parse5";
import { text, patch, elementOpen, elementClose } from "incremental-dom";
import { Htmlparser2TreeAdapterMap } from "parse5-htmlparser2-tree-adapter";
import { LRUCache } from "./LRUCache";

let instance_: Parser | null = null;

export class Parser extends parse5.Parser<Htmlparser2TreeAdapterMap> {
  public patches: LRUCache<
    string,
    (domElement: Element, done?: Function) => void
  >;

  constructor(cacheCapacity: number = 100) {
    super();
    this.patches = new LRUCache<
      string,
      (domElement: Element, done?: Function) => void
    >(cacheCapacity);
  }

  static sharedInstance(cacheCapacity?: number): Parser {
    if (!instance_) {
      instance_ = new Parser(cacheCapacity);
    }
    return instance_;
  }

  createPatch(source: string): (domElement: Node, done?: Function) => void {
    const cachedPatch = this.patches.get(source);
    if (cachedPatch) {
      return cachedPatch;
    }

    let html = String(source).replace(/\n/g, " ").replace(/\r/g, " ");
    const root = parse5.parseFragment<Htmlparser2TreeAdapterMap>(html);
    const nodes = root.childNodes;
    const stack: Function[] = [];
    const createInstruction = (fn: Function) => stack.push(fn);

    const partial = (domElement: Node, done?: Function) => {
      done = typeof done === "function" ? done : () => undefined;
      patch(domElement as unknown as Element, () => {
        stack.forEach((routine) => routine());
        done();
      });
    };

    function getAttribs(node: any): { [key: string]: string } {
      const attribs: { [key: string]: string } = {};
      if (node.attrs && Array.isArray(node.attrs)) {
        node.attrs.forEach((attr) => {
          attribs[attr.name] = attr.value;
        });
      }
      return attribs;
    }

    const traverse = (
      node: any,
      parentId: string = "root",
      index: number = 0,
    ) => {
      const attribs = getAttribs(node);
      const id = attribs.id || `fx-${parentId}-child-${index}`;
      const kv: (string | number)[] = [];

      for (const key in attribs) {
        kv.push(key, attribs[key]);
      }

      const hasChildren = Boolean(node.childNodes && node.childNodes.length);

      if (
        node.nodeName &&
        node.nodeName !== "#text" &&
        node.nodeName !== "#document-fragment"
      ) {
        createInstruction(() => elementOpen(node.nodeName, id, null, ...kv));
        if (hasChildren)
          node.childNodes.forEach((child: any, idx: number) =>
            traverse(child, id, idx),
          );
        createInstruction(() => elementClose(node.nodeName));
      } else if (node.nodeName === "#text" && node.value) {
        createInstruction(() => text(node.value));
      }
    };

    nodes.forEach((node, idx) => traverse(node, "root", idx));
    this.patches.set(source, partial);
    return partial;
  }
}
