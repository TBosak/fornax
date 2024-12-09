import * as parse5 from 'parse5';
import {
  text,
  patch,
  elementOpen,
  elementClose
} from 'incremental-dom';
import { Htmlparser2TreeAdapterMap } from 'parse5-htmlparser2-tree-adapter';

// Re-use your provided Parser class
let instance_: Parser | null = null;

export class Parser extends parse5.Parser<Htmlparser2TreeAdapterMap> {
  public patches: Map<any, (domElement: Element, done?: Function) => void>;

  static sharedInstance(): Parser {
    instance_ = instance_ || new Parser();
    return instance_;
  }

  constructor() {
    super();
    this.patches = new Map();
  }

  createPatch(source: string): (domElement: Node, done?: Function) => void {
    // If patch already exists, return it
    if (this.patches.has(source)) {
        return this.patches.get(source)!;
    }

    // Normalize HTML
    let html = String(source).replace(/\n/g, ' ').replace(/\r/g, ' ');

    const root = parse5.parseFragment<Htmlparser2TreeAdapterMap>(html);
    const nodes = root.childNodes; // Ensure we're using childNodes

    const stack: Function[] = [];
    const createInstruction = (fn: Function) => stack.push(fn);
    
    const partial = (domElement: Node, done?: Function) => {
        done = typeof done === 'function' ? done : () => undefined;
        patch(domElement as unknown as Element, () => {
            stack.forEach(routine => routine());
            done();
        });
    };
    
    function getAttribs(node: any): { [key: string]: string } {
        const attribs: { [key: string]: string } = {};
        if (node.attrs && Array.isArray(node.attrs)) {
            node.attrs.forEach(attr => {
                attribs[attr.name] = attr.value;
            });
        }
        return attribs;
    }
    
    const traverse = (node: any) => {
        const attribs = getAttribs(node);
        const id = attribs.id || crypto.randomUUID(); // or another UUID method
        const kv: (string | number)[] = [];
    
        for (const key in attribs) {
            kv.push(key, attribs[key]);
        }
    
        const hasChildren = Boolean(node.childNodes && node.childNodes.length);
    
        if (node.nodeName && node.nodeName !== '#text' && node.nodeName !== '#document-fragment') {
            // It's an element
            createInstruction(() => elementOpen(node.nodeName, id, null, ...kv));
            if (hasChildren) node.childNodes.forEach(traverse);
            createInstruction(() => elementClose(node.nodeName));
        } else if (node.nodeName === '#text' && node.value) {
            // It's a text node
            createInstruction(() => text(node.value));
        }
    };
    
    nodes.forEach(traverse);
    this.patches.set(source, partial);
    return partial;
}
}