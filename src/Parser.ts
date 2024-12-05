import { parseFragment } from 'parse5';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import {
  text,
  patch,
  elementOpen,
  elementClose,
} from 'incremental-dom';
import { randomUUIDv7 } from 'bun';

type PatchFunction = (domElement: Element, done?: Function) => void;
type InstructionFunction = () => void;

interface ParsedNode {
  type: string;
  name?: string;
  data?: string;
  attribs?: { [key: string]: string };
  children?: ParsedNode[];
}

export default class Parser {
  private patches: Map<string, PatchFunction>;
  private static instance: Parser | null = null;

  constructor() {
    this.patches = new Map();
  }

  public static sharedInstance(): Parser {
    if (!Parser.instance) {
      Parser.instance = new Parser();
    }
    return Parser.instance;
  }

  public createPatch(source: string | Node): PatchFunction {
    let html: string;

    if (source instanceof HTMLElement) {
      html = source.innerHTML;
    } else {
      html = source as string;
    }

    const sourceKey = typeof source === 'string' ? source : html;

    if (this.hasPatch(sourceKey)) {
      return this.getPatch(sourceKey) as PatchFunction;
    }

    html = html.replace(/[\n\r]/g, ' ');

    const root = parseFragment(html, {
      treeAdapter: adapter,
    }) as ParsedNode;
    const nodes = root.children || [];

    const stack: InstructionFunction[] = [];

    const createInstruction = (fn: InstructionFunction) => stack.push(fn);

    const partial: PatchFunction = (domElement: Element, done?: Function) => {
      const callback = ensureFunction(done);
      patch(domElement, () => {
        stack.forEach((routine) => routine());
        callback();
      });
    };

    const traverse = (node: ParsedNode) => {
      const attributesArray: (string | number)[] = [];
      const id = node.attribs?.id || randomUUIDv7("base64", Date.now());;
      const attrs = node.attribs || {};

      for (const [key, value] of Object.entries(attrs)) {
        if (value != null) {
          attributesArray.push(key, value);
        }
      }

      if (node.type === 'tag' && node.name) {
        createInstruction(() => elementOpen(node.name!, id, null, ...attributesArray));
        if (node.children && node.children.length > 0) {
          node.children.forEach(traverse);
        }
        createInstruction(() => elementClose(node.name!));
      } else if (node.type === 'text' && node.data) {
        createInstruction(() => text(node.data!));
      } else if (node.type === 'script') {
        // Skip script nodes
      } else {
        throw new TypeError(`Unhandled node type ${node.type}.`);
      }
    };

    nodes.forEach(traverse);

    this.patches.set(sourceKey, partial);

    return partial;
  }

  private hasPatch(source: string): boolean {
    return this.patches.has(source);
  }

  private getPatch(source: string): PatchFunction | null {
    return this.patches.get(source) || null;
  }
}

const ensureFunction = (fn: unknown): Function =>
  typeof fn === 'function' ? fn : () => {};
