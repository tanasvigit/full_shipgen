import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();

for (const file of [path.join(rootDir, "e2e", ".env"), path.join(rootDir, ".env")]) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: false });
  }
}

export function getE2EConfig() {
  const baseURL = process.env.E2E_BASE_URL || "http://localhost:5173";
  const apiHost = (process.env.E2E_API_URL || process.env.VITE_API_HOST || "http://localhost:8000").replace(/\/$/, "");
  const apiNamespace = process.env.E2E_API_NAMESPACE || process.env.VITE_API_NAMESPACE || "int/v1";
  const apiURL = `${apiHost}/${apiNamespace.replace(/^\/|\/$/g, "")}`;
  const email = process.env.E2E_USER_EMAIL || "";
  const password = process.env.E2E_USER_PASSWORD || "";

  return { baseURL, apiHost, apiURL, email, password };
}

export function requireCredentials() {
  const { email, password } = getE2EConfig();
  if (!email || !password) {
    throw new Error(
      [
        "E2E_USER_EMAIL and E2E_USER_PASSWORD are required.",
        "Copy e2e/.env.example to e2e/.env and set your Fleetbase admin credentials.",
        `Checked: ${path.join(rootDir, "e2e", ".env")}`,
      ].join(" "),
    );
  }
  return { email, password };
}
