#!/usr/bin/env node

import { Command } from "commander";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, "..");

const BANNER = `
  \x1b[36m___                   ____ _           _   \x1b[0m
 \x1b[36m/ _ \\ _ __   ___ _ __  / ___| |__   __ _| |_ \x1b[0m
\x1b[36m| | | | '_ \\ / _ \\ '_ \\| |   | '_ \\ / _\` | __|\x1b[0m
\x1b[36m| |_| | |_) |  __/ | | | |___| | | | (_| | |_ \x1b[0m
 \x1b[36m\\___/| .__/ \\___|_| |_|\\____|_| |_|\\__,_|\\__|\x1b[0m
      \x1b[36m|_|                                     \x1b[0m
`;

/**
 * Check if a port is available on the specified host
 */
function isPortAvailable(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

/**
 * Find the next available port starting from startPort
 */
async function findAvailablePort(startPort, host) {
  let port = startPort;
  const maxPort = startPort + 100;
  while (port < maxPort) {
    const available = await isPortAvailable(port, host);
    if (available) {
      return port;
    }
    port++;
  }
  throw new Error(`Could not find an available port between ${startPort} and ${maxPort}`);
}

/**
 * Wait until the server is reachable via HTTP
 */
function waitForServer(url, timeoutMs = 20000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(check, 300);
        } else {
          resolve(false);
        }
      });
      req.end();
    };
    check();
  });
}

const program = new Command();

program
  .name("openchat")
  .description("OpenChat: Self-hostable, extensible ChatGPT alternative")
  .version("0.1.0")
  .option("-p, --port <number>", "Port to run the OpenChat server on", (val) => parseInt(val, 10), 3000)
  .option("-H, --host <string>", "Host to bind OpenChat server to", "localhost")
  .option("--no-open", "Do not automatically open the browser on start")
  .action(async (options) => {
    console.log(BANNER);

    // 1. Ensure ~/.openchat exists
    const openchatDir =
      process.env["OPENCHAT_HOME"] ||
      process.env["OPENCHAT_DIR"] ||
      path.join(os.homedir(), ".openchat");
    const uploadsDir = path.join(openchatDir, "uploads");

    if (!fs.existsSync(openchatDir)) {
      fs.mkdirSync(openchatDir, { recursive: true });
    }
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 2. Resolve available port
    let port = options.port;
    const available = await isPortAvailable(port, options.host);
    if (!available) {
      const nextPort = await findAvailablePort(port + 1, options.host);
      console.log(`\x1b[33m! Port ${port} is occupied. Falling back to port ${nextPort}.\x1b[0m\n`);
      port = nextPort;
    }

    const host = options.host;
    const url = `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

    console.log(`\x1b[1mOpenChat v0.1.0\x1b[0m`);
    console.log(`  \x1b[32m>\x1b[0m Local:    \x1b[36m${url}\x1b[0m`);
    console.log(`  \x1b[32m>\x1b[0m Storage:  ~/.openchat`);
    console.log();

    // 3. Locate Next.js executable
    const nextBin = path.resolve(packageDir, "node_modules", "next", "dist", "bin", "next");
    const isBuilt = fs.existsSync(path.join(packageDir, ".next"));
    const nextCommand = isBuilt ? "start" : "dev";

    const child = spawn(
      process.execPath,
      [nextBin, nextCommand, "-p", String(port), "-H", host],
      {
        cwd: packageDir,
        stdio: "inherit",
        env: {
          ...process.env,
          PORT: String(port),
          HOSTNAME: host,
        },
      }
    );

    // 4. Open browser if requested
    if (options.open) {
      waitForServer(url).then((ready) => {
        if (ready) {
          open(url).catch(() => {
            // Ignore browser opening failures (e.g. headless servers)
          });
        }
      });
    }

    const shutdown = () => {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  });

program.parse(process.argv);
