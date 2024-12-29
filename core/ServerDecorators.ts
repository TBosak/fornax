import { getGlobalAppInstance, ControllerBase } from "fornax-server";
import { z } from "@hono/zod-openapi";
import { mapTypeScriptTypeToOpenApi } from "./ServerUtilities";

// Server Decorators
export const Get = (path: string, schemas: any, responseSchema: any) =>
  Route("get", path, schemas, responseSchema);
export const Post = (path: string, schemas: any, responseSchema: any) =>
  Route("post", path, schemas, responseSchema);
export const Put = (path: string, schemas: any, responseSchema: any) =>
  Route("put", path, schemas, responseSchema);
export const Delete = (path: string, schemas: any, responseSchema: any) =>
  Route("delete", path, schemas, responseSchema);

export function Controller(basePath: string) {
  const app = getGlobalAppInstance();
  return function (constructor: { new (): ControllerBase }) {
    const instance = new constructor();
    if (!(instance instanceof ControllerBase)) {
      throw new Error("Controllers must extend ControllerBase");
    }
    app.registerController(basePath, instance);
  };
}

export function Model() {
  return function (constructor: Function) {
    const app = getGlobalAppInstance();
    const className = constructor.name;
    const properties = app.metadataRegistry.get(className) || {};

    const zodShape: Record<string, any> = {};
    Object.entries(properties).forEach(([key, value]) => {
      const { type, openapi } = value;

      if (type.openapi && typeof type.openapi === "function") {
        zodShape[key] = type.openapi({
          ...openapi,
          description: openapi?.description || `Property ${key}`,
          example: openapi?.example || null,
        });
      } else {
        console.warn(`Property "${key}" is missing openapi support.`);
      }
    });

    const schema = z.object(zodShape).openapi(className, {
      title: className,
      description: `Schema for ${className}`,
    });

    app.registerOpenAPI(className, schema);
    app.registerModel(className, { schema });
  };
}

//TEST FUNCTIONALITY
export function Middleware(middleware: (ctx: any, next: Function) => void) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalHandler = descriptor.value;

    descriptor.value = async function (ctx: any) {
      await middleware(ctx, async () => await originalHandler.call(this, ctx));
    };
  };
}

export function Property(type: z.ZodTypeAny, openapi: any = {}) {
  return function (target: any, key: string) {
    const app = getGlobalAppInstance();
    if (!app.metadataRegistry.has(target)) {
      app.registerMetadata(target, {});
    }

    const properties = app.metadataRegistry.get(target);
    if (!properties) return;
    properties[key] = { type, openapi };
    app.registerMetadata(target, properties);
  };
}

export function String(openapi: any = {}) {
  return defineProperty(z.string(), openapi);
}

export function OptionalString(openapi: any = {}) {
  return defineProperty(z.string().optional(), openapi);
}

export function Number(openapi: any = {}) {
  return defineProperty(z.number(), openapi);
}

export function OptionalNumber(openapi: any = {}) {
  return defineProperty(z.number().optional(), openapi);
}

export function Boolean(openapi: any = {}) {
  return defineProperty(z.boolean(), openapi);
}

export function OptionalBoolean(openapi: any = {}) {
  return defineProperty(z.boolean().optional(), openapi);
}

export function Array(itemType: z.ZodTypeAny, openapi: any = {}) {
  return defineProperty(z.array(itemType), openapi);
}

export function OptionalArray(itemType: z.ZodTypeAny, openapi: any = {}) {
  return defineProperty(z.array(itemType).optional(), openapi);
}

export function Enum(values: [string, ...string[]], openapi: any = {}) {
  return defineProperty(z.enum(values), { ...openapi, enum: values });
}

export function OptionalEnum(values: [string, ...string[]], openapi: any = {}) {
  return defineProperty(z.enum(values).optional(), {
    ...openapi,
    enum: values,
  });
}

export function ISODate(openapi: any = {}) {
  return defineProperty(
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?$/,
        "Invalid date-time format"
      )
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    { ...openapi, format: "date-time" }
  );
}

export function OptionalISODate(openapi: any = {}) {
  return defineProperty(
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})?$/,
        "Invalid date-time format"
      )
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
      .optional(),
    { ...openapi, format: "date-time" }
  );
}

export function NumberRange(min: number, max: number, openapi: any = {}) {
  return defineProperty(z.number().min(min).max(max), {
    ...openapi,
    minimum: min,
    maximum: max,
  });
}

export function OptionalNumberRange(
  min: number,
  max: number,
  openapi: any = {}
) {
  return defineProperty(z.number().min(min).max(max).optional(), {
    ...openapi,
    minimum: min,
    maximum: max,
  });
}

//TEST FUNCTIONALITY
export function Auth(
  authLogic: (ctx: any) => Promise<void> | void,
  openapi: any = { security: [{ bearerAuth: [] }] }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: any) {
      try {
        await authLogic(ctx);
        return await originalMethod.call(this, ctx);
      } catch (error: any) {
        return ctx.json(
          { error: error.message || "Unauthorized" },
          error.status || 401
        );
      }
    };

    descriptor.value.openapi = openapi;
  };
}

// Server Utilities
export type HttpMethod = "get" | "post" | "put" | "delete";

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
    const app = getGlobalAppInstance();
    const paramsSchema = app.modelRegistry.get(schemas?.params?.name)
      ? app.modelRegistry.get(schemas.params.name)?.schema
      : mapTypeScriptTypeToOpenApi(schemas.params);
    const bodySchema = app.modelRegistry.get(schemas?.body?.name)
      ? app.modelRegistry.get(schemas.body.name)?.schema
      : mapTypeScriptTypeToOpenApi(schemas.body);
    const querySchema = app.modelRegistry.get(schemas?.query?.name)
      ? app.modelRegistry.get(schemas.query.name)?.schema
      : mapTypeScriptTypeToOpenApi(schemas.query);
    const responseSchema = app.modelRegistry.get(responseModel?.name)
      ? app.modelRegistry.get(responseModel.name)?.schema
      : mapTypeScriptTypeToOpenApi(responseModel);

    const controllerName = target.constructor.name;
    const routes = app.routeRegistry.get(controllerName) || [];

    routes.push({
      method,
      path,
      handler: propertyKey,
      schemas: {
        params: paramsSchema,
        body: bodySchema,
        query: querySchema,
        response: responseSchema,
      },
    });
    app.registerRoute(controllerName, routes);
  };
}

export function getSchema(target: any): z.AnyZodObject {
  const app = getGlobalAppInstance();
  const properties = app.metadataRegistry.get(target) || {};
  const zodShape: Record<string, any> = {};

  Object.keys(properties).forEach((key) => {
    const { type, openapi } = properties[key];
    const zodType = type.openapi(openapi);
    zodShape[key] = zodType;
  });

  return z.object(zodShape);
}

export function defineProperty(type: any, openapi: any = {}) {
  return function (target: any, key: string) {
    const app = getGlobalAppInstance();
    const className = target.constructor.name;

    if (!app.metadataRegistry.has(className)) {
      app.registerMetadata(className, {});
    }

    const properties = app.metadataRegistry.get(className)!;
    properties[key] = { type, openapi };
    app.registerMetadata(className, properties);
  };
}
