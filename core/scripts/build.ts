import { copyFileSync, readdirSync } from "fs";
import { loadConfig } from "./load-config";
import { join } from "path";

const config = loadConfig();

(async () => {
  readdirSync(config.Client.srcDir).forEach((file) => {
    if (file.endsWith(".html") || file.endsWith(".ico")) {
      copyFileSync(
        join(config.Client.srcDir, file),
        join(config.Client.distDir, file)
      );
    }
  });

  const initialLoad = true;
  const childProc = Bun.spawn(
    ["bun", `${__dirname}/generate-imports.ts`, String(initialLoad)],
    {
      cwd: process.cwd(),
      env: process.env,
      stdout: "inherit",
      stderr: "inherit",
    }
  );
  await childProc.exited;
})();
