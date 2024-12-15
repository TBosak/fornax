import { resolve } from "path";
import { FornaxConfig } from "../Models";
import { existsSync } from "fs";

export function loadConfig(): FornaxConfig {
  const projectRoot = process.cwd();
  const defaults: FornaxConfig = {
    srcDir: resolve(projectRoot, "./src"),
    distDir: resolve(projectRoot, "./dist"),
    port: 5000,
  };

  const configPath = resolve(projectRoot, "fornax.config.js");
  if (existsSync(configPath)) {
    const cfg = require(configPath);
    return { ...defaults, ...cfg.default };
  }

  console.warn("No fornax.config.js found, using defaults.");
  return defaults;
}
