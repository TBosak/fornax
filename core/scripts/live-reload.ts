import { copyFileSync, watch } from "fs";
import path from "path";
import { loadConfig } from "./load-config";

const config = loadConfig();

watch(config.srcDir, { recursive: true }, async (event, filename) => {
  console.log(
    `File ${filename} changed (${event}) - updating dist...refresh browser to see changes.`
  );
  if (filename.endsWith(".html") || filename.endsWith(".ico")) {
    copyFileSync(filename, path.join(config.distDir, filename.split("/").pop()));
  }
  const childProc = Bun.spawn(["bun", `${__dirname}/generate-imports.ts`], {stdout: "inherit"});
  await childProc.exited;
});
