import { helpers } from './View';

interface TemplateData {
  [key: string]: any;
}

export default class Template {
  public source: string;

  constructor(source: string) {
    this.source = source;
  }

  public render(data: TemplateData = {}): string {
    const sanitizedData = Template.sanitizeData(data);
    const template = this.source.replace(/\#\{/g, '${');
    return new Function(...Object.keys(sanitizedData), `return \`${template}\`;`)(...Object.values(sanitizedData));
  }

  private static sanitizeData(data: TemplateData): TemplateData {
    const result: TemplateData = {};
    for (const [key, value] of Object.entries(data)) {
      if (!helpers.has(key)) {
        result[key] = typeof value === 'string' ? Template.escapeHtml(value) : value;
      }
    }
    for (const [key, value] of helpers.entries()) {
      result[key] = value;
    }
    return result;
  }

  private static escapeHtml(str: string): string {
    return str.replace(/[&<>"'`=\/]/g, (s) => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '`': '&#96;',
        '=': '&#61;',
        '/': '&#47;',
      }[s];
    });
  }

  toString(): string {
    return this.source;
  }

  valueOf(): string {
    return this.source;
  }
}
