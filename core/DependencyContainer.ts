export class DependencyContainer {
  private static instance: DependencyContainer;
  private singletons: Map<Function, any> = new Map();

  private constructor() {}

  /**
   * Retrieves the singleton instance of DependencyContainer.
   */
  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Registers a singleton service.
   * @param constructor The service class constructor.
   * @param serviceName The unique name of the service.
   */
  registerSingleton<T>(
    constructor: { new (...args: any[]): T },
    serviceName: string,
  ): void {
    if (!this.singletons.has(constructor)) {
      const instance = new constructor();
      this.singletons.set(constructor, instance);
    }
  }

  /**
   * Retrieves a singleton instance of a service.
   * @param constructor The service class constructor.
   * @returns The singleton instance.
   */
  getSingleton<T>(constructor: { new (...args: any[]): T }): T {
    const instance = this.singletons.get(constructor);
    if (!instance) {
      throw new Error(`Singleton service ${constructor.name} not found.`);
    }
    return instance;
  }
}
