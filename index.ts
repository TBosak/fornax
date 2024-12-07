// index.ts

import { serve } from "bun";
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import path from 'path';

// Define the directory paths
const rootDir = path.resolve(__dirname, './');
const distDir = path.join(rootDir, 'dist');

// Ensure the dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir);
}

// Copy static HTML files (like index.html) to the dist directory
readdirSync(rootDir).forEach(file => {
  if (file.endsWith('.html')) {
    copyFileSync(path.join(rootDir, file), path.join(distDir, file));
  }
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
    case '.html':
      return 'text/html';
    case '.js':
      return 'application/javascript';
    case '.ts':
      return 'application/typescript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
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

    // Define the path to the requested file
    let filePath = path.join(distDir, pathname);

    // If the path is a directory, append 'index.html'
    if (pathname.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }

    // Check if the file exists
    if (existsSync(filePath) && !path.extname(filePath)) {
      // If no extension, assume it's a directory and append 'index.html'
      filePath = path.join(filePath, 'index.html');
    }

    // Serve the file if it exists
    if (existsSync(filePath) && path.extname(filePath)) {
      return await serveStatic(filePath);
    } else {
      // For SPA routes, serve 'index.html'
      const indexPath = path.join(distDir, 'index.html');
      if (existsSync(indexPath)) {
        return await serveStatic(indexPath);
      } else {
        return new Response("Not Found", { status: 404 });
      }
    }
  },
});

console.log(`Server is running at http://localhost:5000`);
