export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("LRU Cache capacity must be greater than 0");
    }
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const value = this.cache.get(key)!;
    // Move key to the end to mark it as recently used
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Remove existing key to update its position
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict the least recently used (first) key
      const lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey);
    }
    // Insert the key as the most recently used
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
