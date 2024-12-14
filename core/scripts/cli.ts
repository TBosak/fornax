#!/usr/bin/env bun
import { spawnSync, spawn } from 'bun';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { FornaxConfig } from '../Models';
import { loadConfig } from './load-config';

export async function runCommand(cmd: string, args: string[], options: any = {}) {
  const proc = spawnSync({
    cmd: [cmd, ...args],
    stdout: "inherit",
    stderr: "inherit",
    ...options
  });
  if (proc.exitCode !== 0) {
    console.error(`Command "${cmd} ${args.join(' ')}" failed with code ${proc.exitCode}`);
    process.exit(proc.exitCode || 1);
  }
}

export async function runInBackground(cmd: string, args: string[], options: any = {}) {
  const proc = spawn({
    cmd: [cmd, ...args],
    stdout: "inherit",
    stderr: "inherit",
    ...options
  });
  return proc;
}

async function dev(config: FornaxConfig) {

  // Generate imports
    const backendProc = await runInBackground("bun", [`${__dirname}/index.ts`, "--watch"]);

    process.on("SIGINT", () => {
      backendProc.kill();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      backendProc.kill();
      process.exit(0);
    });
}

async function build(config: FornaxConfig) {
  // Generate imports
  await runCommand("bun", ["run", `${__dirname}/build.ts`]);  
  console.log("Build complete!");
}

async function start(config: FornaxConfig) {
  // Ensure dist is built
  if (!existsSync(resolve(config.distDir))) {
    console.log("Dist directory not found. Running build...");
    await build(config);
  }

  // Start server without watch
  const serverProc = await runInBackground("bun", [`${__dirname}/index.ts`]);
  
  process.on("SIGINT", () => {
    serverProc.kill();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    serverProc.kill();
    process.exit(0);
  });
}

(async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const config = loadConfig();

  switch (command) {
    case 'dev':
      await dev(config);
      break;
    case 'build':
      await build(config);
      break;
    case 'start':
      await start(config);
      break;
    default:
      console.log(`Usage: fnx [dev|build|start]`);
      process.exit(1);
  }
})();
