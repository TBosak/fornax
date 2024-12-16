export class DependencyContainer {
  private static instance: DependencyContainer;
  private providers = new Map();

  static getInstance(): DependencyContainer {
    if (!this.instance) {
      this.instance = new DependencyContainer();
    }
    return this.instance;
  }

  registerSingleton<T>(
    constructor: new (...args: any[]) => T,
    serviceName: string
  ) {
    if (!this.providers.has(serviceName)) {
      const instance = this.resolve(constructor);
      this.providers.set(serviceName, instance);
    }
  }

  resolve<T>(constructor: new (...args: any[]) => T): T {
    const dependencies =
      Reflect.getMetadata("design:paramtypes", constructor) || [];
    const injections = dependencies.map((dependency: any) =>
      this.resolve(dependency)
    );
    return new constructor(...injections);
  }

  get<T>(serviceName: string): T | null {
    return this.providers.get(serviceName) || null;
  }
}
