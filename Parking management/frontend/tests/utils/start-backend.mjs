import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

let serverProcess;

function runCommand(command, env = process.env, rejectOnFailure = true) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit',
      env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      if (!rejectOnFailure) {
        resolve(false);
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command}`));
    });
  });
}

async function hasDockerDaemon() {
  const result = await runCommand('docker ps', process.env, false);
  return result !== false;
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }

  serverProcess.kill();
}

process.on('SIGINT', stopServer);
process.on('SIGTERM', stopServer);
process.on('exit', stopServer);

async function main() {
  const sqliteDatabasePath = path.resolve(process.cwd(), 'playwright.sqlite3');
  const useDocker = await hasDockerDaemon();
  const backendEnv = {
    ...process.env,
    PYTEST_CURRENT_TEST: process.env.PYTEST_CURRENT_TEST ?? 'playwright',
  };

  if (useDocker) {
    console.log('Docker detected. Starting backend with Postgres.');
    await runCommand('docker compose up -d', backendEnv);
    await runCommand('python -m alembic upgrade head', backendEnv);
    await runCommand('python -m app.seed.run', backendEnv);
  } else {
    console.log('Docker not available. Falling back to seeded SQLite backend for Playwright.');
    await fs.rm(sqliteDatabasePath, { force: true });
    backendEnv.DATABASE_URL = `sqlite:///${sqliteDatabasePath.replaceAll('\\', '/')}`;
    await runCommand('python -m app.seed.run', backendEnv);
  }

  serverProcess = spawn('python -m uvicorn app.main:app --host 127.0.0.1 --port 8000', {
    shell: true,
    stdio: 'inherit',
    env: backendEnv,
  });

  serverProcess.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
