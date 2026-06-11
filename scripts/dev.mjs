import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const pnpmCommand = isWindows ? "pnpm.cmd" : "pnpm";

const processes = [
  {
    name: "ai-core",
    color: "\x1b[36m",
    args: ["--filter", "@unilife-ai/ai-core", "dev"],
  },
  {
    name: "backend",
    color: "\x1b[33m",
    args: ["--filter", "@unilife-ai/backend", "dev"],
  },
  {
    name: "frontend",
    color: "\x1b[32m",
    args: ["--filter", "@unilife-ai/frontend", "dev"],
  },
];

const reset = "\x1b[0m";
const children = [];
let shuttingDown = false;

function prefixOutput(stream, prefix) {
  let buffered = "";

  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffered += chunk;
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? "";

    for (const line of lines) {
      if (line.length === 0) {
        process.stdout.write("\n");
      } else {
        process.stdout.write(`${prefix}${line}${reset}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (buffered.length > 0) {
      process.stdout.write(`${prefix}${buffered}${reset}\n`);
      buffered = "";
    }
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  const timeout = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 5_000);

  timeout.unref();
  process.exitCode = exitCode;
}

for (const processConfig of processes) {
  const child = spawn(pnpmCommand, processConfig.args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: isWindows,
    env: process.env,
  });

  children.push(child);

  const prefix = `${processConfig.color}[${processConfig.name}]${reset} `;
  prefixOutput(child.stdout, prefix);
  prefixOutput(child.stderr, prefix);

  child.on("error", (error) => {
    process.stderr.write(
      `${prefix}failed to start: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      process.stderr.write(`${prefix}stopped by signal ${signal}\n`);
      shutdown(1);
      return;
    }

    if ((code ?? 0) !== 0) {
      process.stderr.write(`${prefix}exited with code ${code ?? 1}\n`);
      shutdown(code ?? 1);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
