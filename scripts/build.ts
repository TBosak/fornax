(async () => {
const childProc = Bun.spawn(["bun", "./scripts/generate-imports.ts"]);
await childProc.exited;
await Bun.build({ 
    entrypoints: ["./main.ts"],
    outdir: "./dist",
    target: "browser",
 });
})();