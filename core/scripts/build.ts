import { copyFileSync, readdirSync } from "fs";
import { loadConfig } from "./load-config";
import { join } from "path";

const config = loadConfig();

(async () => {
readdirSync(config.srcDir).forEach(file => {
    if (file.endsWith('.html') || file.endsWith('.ico')) {
        copyFileSync(join(config.srcDir, file), join(config.distDir, file));
    }
    });

const childProc = Bun.spawn(["bun", `${__dirname}/generate-imports.ts`], {stdout: "inherit"});
await childProc.exited;
})();