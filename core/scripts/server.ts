import { getProjectInfo } from "../Utilities";
import { readdirSync } from "fs";
import path from "path";
import { loadConfig } from "./load-config";
import { app, metadataRegistry, modelRegistry } from "./constants";

const info = getProjectInfo();
const config = loadConfig();
if (isNaN(config.Server.port)) {
  console.error("Invalid port configuration");
  process.exit(1);
}

async function loadConsumingProjectModules() {
  const controllersDir = path.resolve(
    process.cwd(),
    config.Server.dir,
    "controllers"
  );
  const modelsDir = path.resolve(process.cwd(), config.Server.dir, "models");

  const controllerFiles = readdirSync(controllersDir).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );
  for (const file of controllerFiles) {
    console.log(`Loading controller: ${file}`);
    await import(path.resolve(controllersDir, file));
  }

  const modelFiles = readdirSync(modelsDir).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );
  for (const file of modelFiles) {
    console.log(`Loading model: ${file}`);
    await import(path.resolve(modelsDir, file));
  }
}

// Main function to load modules and start the server
async function main() {
  await loadConsumingProjectModules();
  console.log(
    "Metadata Registry Contents:",
    Array.from(metadataRegistry.entries())
  );
  for (const [key, value] of metadataRegistry.entries()) {
    console.log(`Processing route for: ${key}`);
    console.log("Route metadata:", value.route);

    if (value.route && typeof value.route.path === "string") {
      console.log("Registering route:", value.route);
      app.route(value.route, app);
    } else {
      console.warn(`Invalid route configuration for ${key}:`, value.route);
    }
  }

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: info.version,
      title: info.title,
      description: info.description,
    },
  });

  console.log(`API is running at http://localhost:${config.Server.port}`);

  // Start the server
  Bun.serve({
    fetch: app.fetch,
    port: config.Server.port,
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
