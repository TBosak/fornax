import { copyFileSync, existsSync, watch } from "fs";
import path from "path";
import { loadConfig } from "./load-config";

const config = loadConfig();
const srcDir = config.srcDir;
const distDir = config.distDir;

watch(srcDir, { recursive: true }, async (event, filename) => {
  if (!filename) return; // Sometimes filename may be null

  console.log(
    `File ${filename} changed (${event}) - updating dist...refresh browser to see changes.`,
  );

  // Construct full source path by joining srcDir and filename
  const srcFilePath = path.join(srcDir, filename);

  if (filename.endsWith(".html") || filename.endsWith(".ico")) {
    // Extract just the filename (no directories)
    const baseName = path.basename(filename);
    const destFilePath = path.join(distDir, baseName);

    // Check if source file actually exists before copying
    if (!existsSync(srcFilePath)) {
      console.error(`Source file ${srcFilePath} does not exist!`);
      return;
    }

    copyFileSync(srcFilePath, destFilePath);
    console.log(`Copied ${srcFilePath} to ${destFilePath}`);
  }

  const childProc = Bun.spawn(["bun", `${__dirname}/generate-imports.ts`], {
    stdout: "inherit",
  });
  await childProc.exited;
});