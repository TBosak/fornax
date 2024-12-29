import {
  existsSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  copyFileSync,
  readFileSync,
} from "fs";
import path from "path";
import type { HttpMethod } from "./Models";
import { createRoute, z } from "@hono/zod-openapi";
import {
  metadataRegistry,
  modelRegistry,
  routeRegistry,
} from "./scripts/constants";

export function ensureObject(o: any): object {
  return o != null && typeof o === "object" ? o : {};
}

export function makeSafeObject(o: any, visited = new WeakSet()): any {
  if (o === null || typeof o !== "object") {
    return o;
  }

  if (visited.has(o)) {
    return undefined;
  }

  visited.add(o);

  if (Array.isArray(o)) {
    return o.map((item) => makeSafeObject(item, visited));
  }

  const safeObj: any = {};
  for (const key of Object.keys(o)) {
    const value = o[key];
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

export function getProjectInfo(): any {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return {
      title: packageJson.name || "Unknown Project",
      description: packageJson.description || "",
      version: packageJson.version || "0.0.0",
    };
  } catch (error) {
    console.error("Error reading package.json:", error);
    return "Unknown Project";
  }
}
