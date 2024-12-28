#!/usr/bin/env bun
import { spawnSync, spawn } from "bun";
import { resolve } from "path";
import { existsSync } from "fs";
import inquirer from "inquirer";
import { loadConfig } from "./load-config";
import { generateComponent, generateController } from "../schematics";

const config = loadConfig();

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

async function start(options: {
  client?: boolean;
  server?: boolean;
  menu?: boolean;
}) {
  const procs: any[] = [];

  if (options.menu) {
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to start?",
        choices: [
          { name: "Start client", value: "client" },
          { name: "Start server", value: "server" },
          { name: "Start both", value: "both" },
        ],
      },
    ]);
    switch (answers.action) {
      case "client":
        options.client = true;
        options.server = false;
        break;
      case "server":
        options.client = false;
        options.server = true;
        break;
      case "both":
        options.client = true;
        options.server = true;
        break;
    }
  }

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

async function generate() {
  const args = process.argv.slice(3);
  const [type, name] = args;

  const destMap = {
    component: resolve(config.Client.srcDir, "components"),
    controller: config.Server.dir,
  };

  const promptIfMissing = async () => {
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: "What would you like to generate?",
        choices: ["Component", "Controller"],
      },
      {
        type: "input",
        name: "name",
        message: "Enter the name:",
      },
    ]);
    return { type: answers.type.toLowerCase(), name: answers.name };
  };

  const { type: resolvedType, name: resolvedName } =
    type && name ? { type, name } : await promptIfMissing();

  const destDir = destMap[resolvedType.toLowerCase()];
  if (!destDir) {
    console.error(
      `Unknown type "${resolvedType}". Use "component" or "controller".`
    );
    process.exit(1);
  }

  const generators = {
    component: generateComponent,
    controller: generateController,
  };

  const generator = generators[resolvedType.toLowerCase()];
  if (!generator) {
    console.error(`Invalid type "${resolvedType}".`);
    process.exit(1);
  }

  await generator(resolvedName, destDir);
  console.log(`${resolvedType} "${resolvedName}" successfully created.`);
}

async function showMainMenu() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "Start Client, Server, or Both", value: "start" },
        {
          name: "Generate a Schematic",
          value: "generate",
        },
        { name: "Build the Project", value: "build" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);

  switch (answers.action) {
    case "start":
      await start({ client: true, server: true, menu: true });
      break;
    case "generate":
      await generate();
      break;
    case "build":
      await build();
      break;
    case "exit":
      process.exit(0);
  }
}

(async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    await showMainMenu();
    return;
  }

  switch (command) {
    case "dev":
      await dev({ client: true, server: true });
      break;
    case "build":
      await build();
      break;
    case "start":
      await start({ client: true, server: true });
      break;
    case "start:client":
      await start({ client: true, server: false });
      break;
    case "start:server":
      await start({ client: false, server: true });
      break;
    case "generate":
      await generate();
      break;
    default:
      console.log(
        `Usage: fnx [dev|build|start|start:client|start:server|generate]`
      );
      process.exit(1);
  }
})();
