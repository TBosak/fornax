import { serve } from "bun";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { loadConfig } from "./load-config";

// Define the directory paths
const config = loadConfig();
const rootDir = process.cwd();
const backupDir = path.resolve(__dirname, "../../build"); // Define backup directory

// Ensure the dist directory exists
if (!existsSync(config.distDir)) {
  mkdirSync(config.distDir);
}

const buildProc = Bun.spawn(["bun", `${__dirname}/build.ts`], {
  stdout: "inherit",
});
await buildProc.exited;
const liveReloadProc = Bun.spawn(["bun", `${__dirname}/live-reload.ts`], {
  stdout: "inherit",
});

// Function to serve static files
async function serveStatic(filePath: string): Promise<any> {
  try {
    const fileBuffer = await Bun.file(filePath).arrayBuffer();
    const ext = path.extname(filePath).toLowerCase();
    const contentType = getContentType(ext);
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    return new Response(fileBuffer, { headers });
  } catch (error) {
    console.error(`Error serving file ${filePath}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Function to determine Content-Type based on file extension
function getContentType(ext: string): string {
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "application/javascript";
    case ".ts":
      return "application/typescript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".wasm":
      return "application/wasm";
    default:
      return "application/octet-stream";
  }
}

// Start the server
serve({
  port: 5000,
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Prevent directory traversal attacks
    if (pathname.includes("..")) {
      return new Response("Forbidden", { status: 403 });
    }

    // Define the path to the requested file in the primary directory
    let filePath = path.join(config.distDir, pathname);

    // If the path is a directory, append 'index.html'
    if (pathname.endsWith("/")) {
      filePath = path.join(filePath, "index.html");
    }

    // Check if the file exists in the primary directory
    if (existsSync(filePath) && path.extname(filePath)) {
      return await serveStatic(filePath);
    }

    // Check if the file exists in the backup directory
    const backupFilePath = path.join(backupDir, pathname);
    if (existsSync(backupFilePath) && path.extname(backupFilePath)) {
      return await serveStatic(backupFilePath);
    }

    // For SPA routes, serve 'index.html'
    const indexPath = path.join(config.distDir, "index.html");
    if (existsSync(indexPath)) {
      return await serveStatic(indexPath);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server is running at http://localhost:5000`);

process.on("SIGINT", () => {
  console.log("Received SIGINT. Cleaning up...");
  liveReloadProc.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Cleaning up...");
  liveReloadProc.kill();
  process.exit(0);
});
