import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { OpenAPIHono, z } from "@hono/zod-openapi";

export const app = new OpenAPIHono();
export const zodRegistry = new Map<string, any>();
export const modelRegistry = new Map();
export const metadataRegistry = new Map<
  string,
  Record<string, { type: z.ZodTypeAny; openapi: any }>
>();
export const openAPIRegistry = new OpenAPIRegistry()
export const controllerRegistry = new Map<string, any>();
export const routeRegistry = new Map<string, any>();
