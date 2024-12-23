import { getProjectInfo } from "../Utilities";
import { readdirSync } from "fs";
import path from "path";
import { loadConfig } from "./load-config";
import {
  app,
  controllerRegistry,
  openAPIRegistry,
  routeRegistry,
} from "./constants";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const info = getProjectInfo();
const config = loadConfig();

if (isNaN(config.Server.port)) {
  console.error("Invalid port configuration");
  process.exit(1);
}

async function loadConsumingProjectModules() {
  const loadModules = async (dir: string, type: string) => {
    const files = readdirSync(dir).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );
    for (const file of files) {
      console.log(`Loading ${type}: ${file}`);
      await import(path.resolve(dir, file));
    }
  };

  const controllersDir = path.resolve(
    process.cwd(),
    config.Server.dir,
    "controllers"
  );
  const modelsDir = path.resolve(process.cwd(), config.Server.dir, "models");

  await loadModules(controllersDir, "controller");
  await loadModules(modelsDir, "model");
}

function generateOpenApiPaths() {
  const paths: Record<string, any> = {};

  controllerRegistry.forEach((controller, basePath) => {
    const routes = routeRegistry.get(controller.constructor.name) || [];

    routes.forEach(({ method, path, schemas }) => {
      const fullPath = `${basePath}${path}`;

      if (!paths[fullPath]) {
        paths[fullPath] = {};
      }

      const operation: Record<string, any> = {
        summary: `${method.toUpperCase()} ${fullPath} endpoint`,
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: getMetadata(schemas?.response)
                  ? {
                      $ref: `#/components/schemas/${
                        getMetadata(schemas?.response).title
                      }`,
                    }
                  : { type: "object" },
              },
            },
          },
        },
      };

      if (schemas.params) {
        operation.parameters = [
          {
            name: "params",
            in: "path",
            required: true,
            schema: getMetadata(schemas?.params)
              ? {
                  $ref: `#/components/schemas/${
                    getMetadata(schemas?.params).title
                  }`,
                }
              : { type: "object" },
          },
        ];
      }

      if (schemas.query) {
        operation.parameters = operation.parameters || [];
        operation.parameters.push({
          name: "query",
          in: "query",
          required: false,
          schema: getMetadata(schemas?.query)
            ? {
                $ref: `#/components/schemas/${
                  getMetadata(schemas?.query).title
                }`,
              }
            : { type: "object" },
        });
      }

      if (schemas.body) {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: getMetadata(schemas?.body)
                ? {
                    $ref: `#/components/schemas/${
                      getMetadata(schemas?.body).title
                    }`,
                  }
                : { type: "object" },
            },
          },
        };
      }

      paths[fullPath][method.toLowerCase()] = operation;
    });
  });

  return paths;
}

function getMetadata(schema: any) {
  if (schema?._def?.openapi?.metadata) {
    return {
      title: schema._def.openapi.metadata.title,
      description: schema._def.openapi.metadata.description,
    };
  }
  if (schema?._def?.openapi?._internal?.refId) {
    return { title: schema._def.openapi._internal.refId };
  }
  return {};
}

async function main() {
  await loadConsumingProjectModules();

  controllerRegistry.forEach((controller, basePath) => {
    const routes = routeRegistry.get(controller.constructor.name) || [];
    routes.forEach((route) => {
      controller[route.method](
        route.path,
        controller[route.handler].bind(controller)
      );
    });
    app.route(basePath, controller);
  });

  app.get("/doc", async (ctx: any) => {
    const generator = new OpenApiGeneratorV3(openAPIRegistry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: {
        version: info.version,
        title: info.title || "API Documentation",
        description: info.description || "OpenAPI Specification",
      },
      servers: [{ url: "v1" }],
    });

    spec.paths = generateOpenApiPaths();

    return ctx.json(spec);
  });

  app.get("/swagger", swaggerUI({ url: "/doc" }));

  console.log(`API is running at http://localhost:${config.Server.port}`);

  Bun.serve({
    fetch: app.fetch,
    port: config.Server.port,
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
