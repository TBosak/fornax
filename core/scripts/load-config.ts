import { resolve } from "path";
import { FornaxConfig } from "../Models";
import { existsSync } from "fs";

export function loadConfig(): FornaxConfig {
  const projectRoot = process.cwd();
  const defaults: FornaxConfig = {
    srcDir: resolve(projectRoot, "./src"),
    distDir: resolve(projectRoot, "./dist"),
    port: 5000,
    plugins: [],
    entryPoints: [],
  };

  const configPath = resolve(projectRoot, "fornax.config.ts");
  if (existsSync(configPath)) {
    const cfg = require(configPath);
    return { ...defaults, ...cfg.default };
  }

  console.warn("No fornax.config.ts found, using defaults.");
  return defaults;
}
