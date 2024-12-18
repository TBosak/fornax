import { readdirSync, rmSync, writeFileSync } from "fs";
import { basename, extname, join, resolve } from "path";
import { loadConfig } from "./load-config";
import { copyFolderRecursiveSync } from "../Utilities";

const config = loadConfig();

try {
  clearChunks(config.distDir);
  const componentsDir = resolve(config.srcDir, "./app/components");
  const servicesDir = resolve(config.srcDir, "./app/services");
  const srcDir = resolve(config.srcDir);
  const srcFiles = readdirSync(config.srcDir);
  const componentFiles = readdirSync(componentsDir);
  const serviceFiles = readdirSync(servicesDir);
  const imports =
    getImportPaths(componentFiles, componentsDir) +
    "\n" +
    getImportPaths(srcFiles, srcDir) +
    "\n" +
    getImportPaths(serviceFiles, servicesDir);
  function getImportPaths(files: string[], dir: string): string {
    return files
      .filter((file: any) => {
        const ext = extname(file);
        return (ext === ".ts" || ext === ".tsx") && !file.endsWith("main.ts");
      })
      .map((file: any) => {
        const importPath = `${dir.replaceAll("\\", "/")}/${basename(
          file,
          extname(file)
        )}`;
        return `import "${importPath}";`;
      })
      .join("\n");
  }

  const code = imports;
  const entryFile = join(process.cwd(), "main.ts");
  const routes = join(config.srcDir, "routes.ts");

  writeFileSync(entryFile, code, "utf-8");

  const build = await Bun.build({
    entrypoints: [entryFile, routes],
    outdir: config.distDir,
    target: "browser",
    splitting: true,
    naming: {
      entry: "[name].[ext]",
    },
  });

  copyFolderRecursiveSync(
    join(config.srcDir, "assets"),
    join(config.distDir, "assets")
  );

  if (build.logs.length) {
    console.log(build.logs);
  }
} catch (e) {
  console.error(e);
}

function clearChunks(distDir: string) {
  try {
    const files = readdirSync(distDir);
    const chunkRegex = /^chunk-.*\.js$/;
    for (const file of files) {
      if (chunkRegex.test(file)) {
        const filePath = join(distDir, file);
        rmSync(filePath, { force: true });
      }
    }
  } catch (error) {
    console.error(`Error clearing chunks in ${distDir}:`, error);
  }
}