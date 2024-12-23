import path from "path";
import { FornaxConfig } from "../Models";
import { existsSync } from "fs";

export function loadConfig(): FornaxConfig {
  const projectRoot = process.cwd();
  const defaults: FornaxConfig = {
    Client: {
      srcDir: path.resolve(projectRoot, "./src/client"),
      distDir: path.resolve(projectRoot, "./dist"),
      port: 5000,
      plugins: [],
      entryPoints: [],
    },
    Server: {
      dir: path.resolve(projectRoot, "./src/server"),
      port: 3000,
    },
  };

  const configPath = path.resolve(projectRoot, "fornax.config.ts");
  if (existsSync(configPath)) {
    const cfg = require(configPath);
    return { ...defaults, ...cfg.default };
  }

  console.warn("No fornax.config.ts found, using defaults.");
  return defaults;
}
