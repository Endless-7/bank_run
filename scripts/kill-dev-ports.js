import { execSync } from "node:child_process";
import { platform } from "node:os";

const PORTS = [3001, 5173, 5174, 5175, 5176];

function killPortWindows(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
    });
    const pids = new Set();

    for (const line of output.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && pid !== "0") pids.add(pid);
    }

    for (const pid of pids) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`[dev:kill] stopped PID ${pid} (port ${port})`);
    }
  } catch {
    // No process on this port.
  }
}

function killPortUnix(port) {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null`, {
      shell: true,
      stdio: "ignore",
    });
    console.log(`[dev:kill] cleared port ${port}`);
  } catch {
    // No process on this port.
  }
}

for (const port of PORTS) {
  if (platform() === "win32") {
    killPortWindows(port);
  } else {
    killPortUnix(port);
  }
}

console.log("[dev:kill] dev ports cleared");
