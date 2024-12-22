import { OpenAPIHono } from "@hono/zod-openapi";

export const app = new OpenAPIHono();
export const metadataRegistry = new Map();
export const modelRegistry = new Map();
