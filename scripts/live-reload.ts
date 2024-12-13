import { copyFileSync, watch } from "fs";
import path from "path";

const srcDir = path.resolve("./src");
const distDir = path.resolve("./dist");

watch(srcDir, { recursive: true }, async (event, filename) => {
  console.log(
    `File ${filename} changed (${event}) - updating dist...refresh browser to see changes.`
  );
  if (filename.endsWith(".html") || filename.endsWith(".ico")) {
    copyFileSync(filename, path.join(distDir, filename.split("/").pop()));
  }
  const childProc = Bun.spawn(["bun", "./scripts/generate-imports.ts"]);
  await childProc.exited;
  await Bun.build({
    entrypoints: ["./main.ts"],
    outdir: "./dist",
    target: "browser",
  });
});
