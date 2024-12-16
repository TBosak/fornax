export class Context {
  private static context = new Map<string, any>();

  static provide<T>(key: string, value: T): void {
    this.context.set(key, value);
  }

  static get<T>(key: string): T {
    return this.context.get(key);
  }
}
