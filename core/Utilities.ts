// Utility functions
export function ensureObject(o: any): object {
    return o != null && typeof o === 'object' ? o : {};
  }
  
  export function makeSafeObject(o: any, visited = new WeakSet()): any {
    if (o === null || typeof o !== 'object') {
        // Return the value as-is if it's not an object
        return o;
    }

    if (visited.has(o)) {
        // Circular reference detected; return undefined or a placeholder
        return undefined;
    }

    visited.add(o);

    if (Array.isArray(o)) {
        // Process each item in the array
        return o.map(item => makeSafeObject(item, visited));
    }

    // Create a new object to avoid modifying the original
    const safeObj: any = {};
    for (const key of Object.keys(o)) {
        const value = o[key];
        // Exclude functions
        if (typeof value !== 'function') {
            safeObj[key] = makeSafeObject(value, visited);
        }
    }

    return safeObj;
}
  