import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enableHealthCheck = process.env.ENABLE_HEALTH_CHECK === "true";
const startedAt = Date.now();

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export default defineConfig({
  plugins: [
    react({
      include: /\.[jt]sx?$/,
    }),
    {
      name: "fleetbase-health-check",
      configureServer(server) {
        if (!enableHealthCheck) {
          return;
        }

        server.middlewares.use((req, res, next) => {
          if (!req.url) {
            next();
            return;
          }

          const pathname = req.url.split("?")[0];
          const healthy = true;

          if (pathname === "/health/simple") {
            res.statusCode = healthy ? 200 : 503;
            res.end(healthy ? "OK" : "ERROR");
            return;
          }

          if (pathname === "/health/live") {
            sendJson(res, 200, { alive: true, timestamp: new Date().toISOString() });
            return;
          }

          if (pathname === "/health/ready") {
            sendJson(res, healthy ? 200 : 503, {
              ready: healthy,
              state: healthy ? "success" : "failed",
            });
            return;
          }

          if (pathname === "/health") {
            sendJson(res, healthy ? 200 : 503, {
              status: healthy ? "healthy" : "unhealthy",
              timestamp: new Date().toISOString(),
              uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
              environment: process.env.NODE_ENV || "development",
            });
            return;
          }

          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    watch: {
      ignored: [
        "**/.git/**",
        "**/build/**",
        "**/dist/**",
        "**/coverage/**",
        "**/playwright-report/**",
        "**/test-results/**",
      ],
    },
  },
});
