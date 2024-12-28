import { existsSync, mkdirSync, rm, writeFileSync } from "fs";
import { resolve, join } from "path";
import { render } from "ejs";
import templates from "./templates.toml";
import { spawn } from "bun";

function writeFile(filePath: string, content: string) {
  const dir = resolve(filePath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content, "utf-8");
}

function renderTemplate(
  template: string,
  data: Record<string, any>
): string | Promise<string> {
  return render(template, data, { async: true, rmWhitespace: true });
}

export async function generateComponent(name: string, destDir: string) {
  const componentDir = resolve(destDir, name);
  mkdirSync(componentDir, { recursive: true });

  const schematics = ["html", "css", "ts"];

  schematics.forEach(async (type) => {
    const content = await renderTemplate(templates.component[type], { name });
    writeFile(join(componentDir, `${name}.component.${type}`), content);
  });

  console.log(`Component "${name}" created at ${componentDir}`);
}

export async function generateController(name: string, destDir: string) {
  const controllersDir = resolve(destDir, "controllers");
  const modelsDir = resolve(destDir, "models");
  mkdirSync(controllersDir, { recursive: true });
  mkdirSync(modelsDir, { recursive: true });
  const schematics = [
    { dir: modelsDir, type: "model" },
    { dir: controllersDir, type: "controller" },
  ];

  schematics.forEach(async ({ dir, type }) => {
    const content = await renderTemplate(templates.controller[type], { name });
    writeFile(
      join(dir, `${name}.${type === "controller" ? type + "." : ""}ts`),
      content
    );
  });

  console.log(`Component "${name}" created at ${destDir}`);
}

export async function generateProject(projectName: string, destDir: string) {
  const projectPath = resolve(destDir, projectName);
  const proc = spawn({
    cmd: ["bun", "create", "tbosak/create-fornax", projectName],
    cwd: destDir,
    stdout: "inherit",
    stderr: "inherit",
  });
  console.log(`Project "${projectName}" created at ${projectPath}`);
}
