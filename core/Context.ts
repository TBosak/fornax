type ServiceFactory<T> = () => T;

export class Context {
  private static context = new Map<string, ServiceFactory<any>>();
  private static instances = new Map<string, any>(); // Cache for service instances

  // Register a factory for a service
  static provide<T>(key: string, factory: ServiceFactory<T>): void {
    this.context.set(key, factory);
  }

  // Retrieve the service instance (lazy initialization)
  static get<T>(key: string): T | undefined {
    // If the instance already exists, return it
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }

    // Otherwise, create and cache the instance
    const factory = this.context.get(key);
    if (factory) {
      const instance = factory();
      this.instances.set(key, instance);
      return instance;
    }

    return undefined; // Service not found
  }

  // Optional: Remove a service instance
  static remove(key: string): void {
    this.instances.delete(key);
  }
}
