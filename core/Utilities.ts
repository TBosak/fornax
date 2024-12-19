import {
  existsSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  copyFileSync,
} from "fs";
import path from "path";
import { minifyCSS } from "../build/release";

export function ensureObject(o: any): object {
  return o != null && typeof o === "object" ? o : {};
}

export function makeSafeObject(o: any, visited = new WeakSet()): any {
  if (o === null || typeof o !== "object") {
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
    return o.map((item) => makeSafeObject(item, visited));
  }

  // Create a new object to avoid modifying the original
  const safeObj: any = {};
  for (const key of Object.keys(o)) {
    const value = o[key];
    // Exclude functions
    if (typeof value !== "function") {
      safeObj[key] = makeSafeObject(value, visited);
    }
  }

  return safeObj;
}

export function copyFolderRecursiveSync(src, dest) {
  const exists = existsSync(dest);
  if (!exists) {
    mkdirSync(dest);
  }

  const files = readdirSync(src);

  for (const file of files) {
    const srcFilePath = path.join(src, file);
    const destFilePath = path.join(dest, file);

    const stat = lstatSync(srcFilePath);

    if (stat.isFile()) {
      copyFileSync(srcFilePath, destFilePath);
    } else if (stat.isDirectory()) {
      copyFolderRecursiveSync(srcFilePath, destFilePath);
    }
  }
}

export function throttle(callback: Function, limit: number) {
  let inThrottle: boolean;
  return function (...args: any[]) {
    if (!inThrottle) {
      callback(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export { minifyCSS };
