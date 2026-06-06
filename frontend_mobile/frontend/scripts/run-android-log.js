const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const logPath = path.join(process.cwd(), "build-log.txt");
const logStream = fs.createWriteStream(logPath, { flags: "w" });
const args = ["react-native", "run-android", ...process.argv.slice(2)];
const command = process.platform === "win32" ? "npx.cmd" : "npx";

console.log(`Logging output to ${logPath}`);

const child = spawn(command, args, {
  cwd: process.cwd(),
  shell: process.platform === "win32",
  env: process.env,
});

function tee(chunk) {
  logStream.write(chunk);
  process.stdout.write(chunk);
}

function teeErr(chunk) {
  logStream.write(chunk);
  process.stderr.write(chunk);
}

child.stdout.on("data", tee);
child.stderr.on("data", teeErr);

child.on("close", (code) => {
  logStream.end();
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  logStream.end();
  console.error(error);
  process.exit(1);
});
