import {
  existsSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  copyFileSync,
  readFileSync,
} from "fs";
import path from "path";
import { HttpMethod } from "./Models";
import { createRoute, z } from "@hono/zod-openapi";
import { metadataRegistry, modelRegistry } from "./scripts/constants";

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

// Server Utilities

export function Route(
  method: HttpMethod,
  path: string,
  schemas: { params?: any; body?: any; query?: any },
  responseModel: any
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const paramsSchema = schemas.params
      ? modelRegistry.get(schemas.params.name)?.schema
      : undefined;
    const bodySchema = schemas.body
      ? modelRegistry.get(schemas.body.name)?.schema
      : undefined;
    const responseSchema = responseModel
      ? modelRegistry.get(responseModel.name)?.schema
      : undefined;

    if (!paramsSchema && schemas.params) {
      console.warn(`Schema for params not found: ${schemas.params.name}`);
    }
    if (!bodySchema && schemas.body) {
      console.warn(`Schema for body not found: ${schemas.body.name}`);
    }
    if (!responseSchema && responseModel) {
      console.warn(`Schema for response not found: ${responseModel.name}`);
    }

    const route = createRoute({
      method,
      path,
      request: { params: paramsSchema, body: bodySchema },
      responses: {
        200: {
          description: "Successful response",
          content: { "application/json": { schema: responseSchema } },
        },
      },
    });

    metadataRegistry.set(`${method.toUpperCase()} ${path}`, { route });
  };
}

export function getSchema(target: any): z.AnyZodObject {
  const properties = metadataRegistry.get(target) || {};
  const zodShape: Record<string, any> = {};

  Object.keys(properties).forEach((key) => {
    const { type, openapi } = properties[key];
    const zodType = type.openapi(openapi); // Attach OpenAPI metadata
    zodShape[key] = zodType;
  });

  return z.object(zodShape);
}

export function defineProperty(type: any, openapi: any = {}) {
  return function (target: any, key: string) {
    if (!metadataRegistry.has(target)) {
      metadataRegistry.set(target, {});
    }

    const properties = metadataRegistry.get(target);
    properties[key] = { type, openapi };
    metadataRegistry.set(target, properties);
  };
}
