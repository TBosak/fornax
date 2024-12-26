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

async function dev(options: { client?: boolean; server?: boolean }) {
  const procs: any[] = [];

  if (options.client ?? true) {
    console.log("Starting client in watch mode...");
    const clientProc = await runInBackground("bun", [
      `${__dirname}/client.ts`,
      "--watch",
    ]);
    procs.push(clientProc);
  }

  if (options.server ?? true) {
    console.log("Starting server...");
    const serverProc = Bun.spawn(["bun", `${__dirname}/server.ts`], {
      cwd: process.cwd(),
      env: process.env,
      stdout: "inherit",
      stderr: "inherit",
    });
    procs.push(serverProc);
  }

  process.on("SIGINT", () => {
    procs.forEach((proc) => proc.kill());
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    procs.forEach((proc) => proc.kill());
    process.exit(0);
  });
}

async function build() {
  console.log("Building project...");
  await runCommand("bun", ["run", `${__dirname}/build.ts`]);
  console.log("Build complete!");
}

async function start(
  config: FornaxConfig,
  options: { client?: boolean; server?: boolean }
) {
  const procs: any[] = [];

  if ((options.client ?? true) && !existsSync(resolve(config.Client.distDir))) {
    console.log("Dist directory not found. Running build...");
    await build();
  }

  if (options.client ?? true) {
    console.log("Starting client...");
    const clientProc = await runInBackground("bun", [`${__dirname}/client.ts`]);
    procs.push(clientProc);
  }

  if (options.server ?? true) {
    console.log("Starting server...");
    const serverProc = Bun.spawn(["bun", `${__dirname}/server.ts`], {
      cwd: process.cwd(),
      env: process.env,
      stdout: "inherit",
      stderr: "inherit",
    });
    procs.push(serverProc);
  }

  process.on("SIGINT", () => {
    procs.forEach((proc) => proc.kill());
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    procs.forEach((proc) => proc.kill());
    process.exit(0);
  });
}

(async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const config = loadConfig();

  switch (command) {
    case "dev":
      await dev({
        client: true,
        server: true,
      });
      break;
    case "build":
      await build();
      break;
    case "start":
      await start(config, {
        client: true,
        server: true,
      });
      break;
    case "start:client":
      await start(config, { client: true, server: false });
      break;
    case "start:server":
      await start(config, { client: false, server: true });
      break;
    default:
      console.log(`Usage: fnx [dev|build|start|start:client|start:server]`);
      process.exit(1);
  }
})();
