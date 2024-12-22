#!/usr/bin/env bun
import { spawnSync, spawn } from "bun";
import { resolve } from "path";
import { existsSync } from "fs";
import { FornaxConfig } from "../Models";
import { loadConfig } from "./load-config";

export async function runCommand(
  cmd: string,
  args: string[],
  options: any = {}
) {
  const proc = spawnSync({
    cmd: [cmd, ...args],
    stdout: "inherit",
    stderr: "inherit",
    ...options,
  });
  if (proc.exitCode !== 0) {
    console.error(
      `Command "${cmd} ${args.join(" ")}" failed with code ${proc.exitCode}`
    );
    process.exit(proc.exitCode || 1);
  }
}

export async function runInBackground(
  cmd: string,
  args: string[],
  options: any = {}
) {
  const proc = spawn({
    cmd: [cmd, ...args],
    stdout: "inherit",
    stderr: "inherit",
    ...options,
  });
  return proc;
}

async function dev() {
  // Generate imports
  const clientProc = await runInBackground("bun", [
    `${__dirname}/client.ts`,
    "--watch",
  ]);
  const serverProc = Bun.spawn(["bun", `${__dirname}/server.ts`], {
    cwd: process.cwd(),
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });

  process.on("SIGINT", () => {
    clientProc.kill();
    serverProc.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    clientProc.kill();
    serverProc.kill();
    process.exit(0);
  });
}

async function build() {
  // Generate imports
  await runCommand("bun", ["run", `${__dirname}/build.ts`]);
  console.log("Build complete!");
}

async function start(config: FornaxConfig) {
  // Ensure dist is built
  if (!existsSync(resolve(config.Client.distDir))) {
    console.log("Dist directory not found. Running build...");
    await build();
  }

  // Start server without watch
  const clientProc = await runInBackground("bun", [`${__dirname}/client.ts`]);
  const serverProc = Bun.spawn(["bun", `${__dirname}/server.ts`], {
    cwd: process.cwd(),
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });

  process.on("SIGINT", () => {
    clientProc.kill();
    serverProc.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    clientProc.kill();
    serverProc.kill();
    process.exit(0);
  });
}

(async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const config = loadConfig();

  switch (command) {
    case "dev":
      await dev();
      break;
    case "build":
      await build();
      break;
    case "start":
      await start(config);
      break;
    default:
      console.log(`Usage: fnx [dev|build|start]`);
      process.exit(1);
  }
})();
