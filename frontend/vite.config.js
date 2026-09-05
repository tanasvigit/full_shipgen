import fs from "fs";
import http from "node:http";
import https from "node:https";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { shouldProxyFleetOpsRequest } from "./src/lib/fleetops/fleetOpsProxy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const yardSrc = path.resolve(__dirname, "../yms/frontend_1/src");
const pmsSrc = path.resolve(__dirname, "../Parking management/frontend/src");
const fleetSrc = path.resolve(__dirname, "src");
const enableHealthCheck = process.env.ENABLE_HEALTH_CHECK === "true";
const startedAt = Date.now();

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

function resolveWithExtensions(basePath) {
  const candidates = [
    `${basePath}.jsx`,
    `${basePath}.js`,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    path.join(basePath, "index.jsx"),
    path.join(basePath, "index.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }
  return `${basePath}.js`;
}

function isYardImporter(importer) {
  if (!importer) return false;
  return importer.replace(/\\/g, "/").includes("/yms/frontend_1/");
}

function isPmsImporter(importer) {
  if (!importer) return false;
  return importer.replace(/\\/g, "/").includes("/Parking management/");
}

function isEmbeddedImporter(importer) {
  return isYardImporter(importer) || isPmsImporter(importer);
}

function embeddedSrcForImporter(importer) {
  if (isYardImporter(importer)) return yardSrc;
  if (isPmsImporter(importer)) return pmsSrc;
  return null;
}

/** Resolve `@/` to YMS, PMS, or Shipgen src based on importer context. */
function fleetAndEmbeddedAliasPlugin() {
  return {
    name: "fleet-embedded-alias",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.startsWith("@/")) return null;
      const subpath = source.slice(2);
      const embeddedSrc = embeddedSrcForImporter(importer);
      if (embeddedSrc) {
        return resolveWithExtensions(path.resolve(embeddedSrc, subpath));
      }
      return resolveWithExtensions(path.resolve(fleetSrc, subpath));
    },
  };
}

function pickConditionalExport(exportEntry) {
  if (typeof exportEntry === "string") return exportEntry;
  if (!exportEntry || typeof exportEntry !== "object") return null;

  const importField = exportEntry.import;
  const importPath = typeof importField === "string" ? importField : importField?.default;

  return (
    importPath ||
    exportField(exportEntry, "browser") ||
    exportField(exportEntry, "module") ||
    (typeof exportEntry.default === "string" ? exportEntry.default : null)
  );
}

function exportField(exportEntry, key) {
  const value = exportEntry[key];
  return typeof value === "string" ? value : value?.default;
}

function resolvePackageEsmEntry(specifier) {
  const pkgName = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
  const pkgJsonPath = path.join(__dirname, "node_modules", pkgName, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return null;

  const pkgDir = path.dirname(pkgJsonPath);
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  const subpath = specifier === pkgName ? "." : `.${specifier.slice(pkgName.length)}`;
  const exportEntry = pkg.exports?.[subpath];
  const entry = pickConditionalExport(exportEntry) || pkg.browser || pkg.module;

  if (typeof entry === "string") {
    const resolved = path.resolve(pkgDir, entry);
    return fs.existsSync(resolved) ? resolved : null;
  }

  if (typeof pkg.main === "string" && !pkg.exports) {
    const resolved = path.resolve(pkgDir, pkg.main);
    return fs.existsSync(resolved) ? resolved : null;
  }

  return null;
}

function resolveEsToolkitCompatModule(source) {
  const match = source.match(/^es-toolkit\/compat\/([\w]+)(?:\.js)?$/);
  if (!match) return null;

  const name = match[1];
  const shimPath = path.join(__dirname, "node_modules/es-toolkit/compat", `${name}.js`);
  if (!fs.existsSync(shimPath)) return null;

  const shim = fs.readFileSync(shimPath, "utf8");
  const reqMatch = shim.match(/require\('\.\.\/dist\/compat\/(.+)\.js'\)\.(\w+)/);
  if (!reqMatch) return null;

  const [, subpath, exportName] = reqMatch;
  const mjsPath = path.resolve(__dirname, "node_modules/es-toolkit/dist/compat", `${subpath}.mjs`);
  if (!fs.existsSync(mjsPath)) return null;

  return { exportName, mjsPath };
}

/** Recharts imports `es-toolkit/compat/*` as default; package shims are CJS-only. */
function esToolkitCompatPlugin() {
  const virtualPrefix = "\0es-toolkit-compat:";

  return {
    name: "es-toolkit-compat",
    enforce: "pre",
    resolveId(source) {
      const resolved = resolveEsToolkitCompatModule(source);
      if (!resolved) return null;
      const canonical = source.replace(/\.js$/, "");
      return `${virtualPrefix}${canonical}`;
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) return null;
      const source = id.slice(virtualPrefix.length);
      const resolved = resolveEsToolkitCompatModule(source);
      if (!resolved) return null;
      const { exportName, mjsPath } = resolved;
      return `export { ${exportName} as default } from ${JSON.stringify(mjsPath)};`;
    },
  };
}

function getPackageRoot(specifier) {
  return specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
}

/**
 * Packages whose published ESM trees pull in CJS-only deps (e.g. recharts → use-sync-external-store).
 * Resolve these through Vite's normal pipeline instead of raw module entry files.
 */
const YARD_DELEGATE_TO_VITE = new Set(["recharts", "react-redux"]);

const fleetResolveAnchor = path.join(fleetSrc, "App.jsx");

/** Resolve npm packages for embedded engine files to Shipgen node_modules using ESM entries. */
function embeddedDependencyResolverPlugin() {
  return {
    name: "embedded-dependency-resolver",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!isEmbeddedImporter(importer)) return null;
      if (
        source.startsWith(".") ||
        source.startsWith("/") ||
        source.startsWith("@/") ||
        source.startsWith("@yard") ||
        source.startsWith("@pms")
      ) {
        return null;
      }
      if (YARD_DELEGATE_TO_VITE.has(getPackageRoot(source))) {
        return this.resolve(source, fleetResolveAnchor, { skipSelf: true });
      }
      return resolvePackageEsmEntry(source);
    },
  };
}

function resolveUseSyncExternalStoreShim(source) {
  const canonical = source.replace(/\.js$/, "");
  if (canonical === "use-sync-external-store/shim/with-selector") {
    const cjsPath = path.resolve(
      __dirname,
      "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js",
    );
    return { cjsPath, exportName: "useSyncExternalStoreWithSelector" };
  }
  if (canonical === "use-sync-external-store/shim") {
    const cjsPath = path.resolve(
      __dirname,
      "node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js",
    );
    return { cjsPath, exportName: "useSyncExternalStore" };
  }
  return null;
}

/** Recharts ESM imports CJS shims that lack named exports when served raw. */
function useSyncExternalStoreShimPlugin() {
  const virtualPrefix = "\0use-sync-external-store:";

  return {
    name: "use-sync-external-store-shim",
    enforce: "pre",
    resolveId(source) {
      const resolved = resolveUseSyncExternalStoreShim(source);
      if (!resolved) return null;
      return `${virtualPrefix}${source.replace(/\.js$/, "")}`;
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) return null;
      const source = id.slice(virtualPrefix.length);
      const resolved = resolveUseSyncExternalStoreShim(source);
      if (!resolved) return null;
      const { cjsPath, exportName } = resolved;
      return `
import * as mod from ${JSON.stringify(cjsPath)};
const value = mod.${exportName} ?? mod.default?.${exportName} ?? mod.default;
export { value as ${exportName} };
export default value;
`;
    },
  };
}

/** Pre-bundle YMS + shared UI deps so Vite uses ESM entry points (not CJS via require.resolve). */
const OPTIMIZE_DEPS = [
  "react-router-dom",
  "react-router",
  "react-router/dom",
  "cookie",
  "clsx",
  "tailwind-merge",
  "lucide-react",
  "recharts",
  "sonner",
  "swr",
  "dayjs",
  "lodash",
  "framer-motion",
  "@tanstack/react-query",
  "jspdf",
  "jspdf-autotable",
  "es-toolkit/compat/get",
  "es-toolkit/compat/omit",
  "es-toolkit/compat/sortBy",
  "es-toolkit/compat/throttle",
  "es-toolkit/compat/maxBy",
  "es-toolkit/compat/minBy",
  "es-toolkit/compat/sumBy",
  "es-toolkit/compat/last",
  "es-toolkit/compat/range",
  "es-toolkit/compat/isPlainObject",
  "es-toolkit/compat/uniqBy",
  "use-sync-external-store/shim",
  "use-sync-external-store/shim/with-selector",
  "react-redux",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  // Proxy target only (Vite server → gateway). Browser API host stays same-origin via env.js.
  // Docker Compose sets VITE_PROXY_TARGET=http://gateway:80; host `npm run dev` defaults to :8000.
  const apiHost = (env.VITE_PROXY_TARGET || env.VITE_API_HOST || "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
  const socketHost = (env.VITE_SOCKET_HOST || "http://localhost:38000").replace(/\/+$/, "");
  const ymsApiBase = env.VITE_YMS_API_BASE_URL || "/api/yms";
  const pmsApiBase = env.VITE_PMS_API_BASE_URL || "/api/pms";
  const yardBasePath = env.VITE_YARD_BASE_PATH || "/yard";
  const pmsBasePath = env.VITE_PMS_BASE_PATH || "/parking";
  const usePolling =
    env.CHOKIDAR_USEPOLLING === "true" ||
    env.WATCHPACK_POLLING === "true" ||
    process.env.CHOKIDAR_USEPOLLING === "true";
  // Reuse TCP connections to the gateway — Vite's default proxy opens a new socket
  // per request and queues badly under Docker + chokidar polling (startup storm → ~20s).
  const proxyAgent = apiHost.startsWith("https")
    ? new https.Agent({ keepAlive: true, maxSockets: 64 })
    : new http.Agent({ keepAlive: true, maxSockets: 64 });
  const apiProxy = {
    target: apiHost,
    changeOrigin: true,
    agent: proxyAgent,
    timeout: 20000,
    proxyTimeout: 20000,
  };

  return {
    plugins: [
      fleetAndEmbeddedAliasPlugin(),
      esToolkitCompatPlugin(),
      useSyncExternalStoreShimPlugin(),
      embeddedDependencyResolverPlugin(),
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
    define: {
      "process.env.REACT_APP_API_BASE_URL": JSON.stringify(ymsApiBase),
      "process.env.REACT_APP_YARD_BASE_PATH": JSON.stringify(yardBasePath),
      "process.env.REACT_APP_PMS_BASE_PATH": JSON.stringify(pmsBasePath),
      "process.env.REACT_APP_PMS_API_BASE_URL": JSON.stringify(pmsApiBase),
      "process.env.REACT_APP_ENABLE_DEV_ROLE_OVERRIDE": JSON.stringify(
        env.VITE_YMS_ENABLE_DEV_ROLE_OVERRIDE || "false",
      ),
      "import.meta.env.VITE_PMS_BASE_PATH": JSON.stringify(pmsBasePath),
      "import.meta.env.VITE_PMS_API_BASE_URL": JSON.stringify(pmsApiBase),
    },
    resolve: {
      dedupe: [
        "react",
        "react-dom",
        "react-router",
        "react-router-dom",
        "cookie",
        "clsx",
        "tailwind-merge",
        "@tanstack/react-query",
      ],
      alias: {
        "@yard": yardSrc,
        "@pms": pmsSrc,
        clsx: path.resolve(__dirname, "node_modules/clsx/dist/clsx.mjs"),
        jspdf: path.resolve(__dirname, "node_modules/jspdf/dist/jspdf.es.min.js"),
        "jspdf-autotable": path.resolve(
          __dirname,
          "node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.mjs",
        ),
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime"),
      },
    },
    optimizeDeps: {
      include: OPTIMIZE_DEPS,
    },
    build: {
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return null;
            // Match only the React runtime packages — not @radix-ui/react-*,
            // @emotion/react, react-leaflet, etc. Broad "includes('react')"
            // splits create circular chunk init and runtime:
            // Cannot read properties of undefined (reading 'createContext').
            const norm = id.replace(/\\/g, "/");
            if (
              /\/node_modules\/(react|react-dom|scheduler)\//.test(norm) ||
              /\/node_modules\/react-router(-dom)?\//.test(norm)
            ) {
              return "vendor-react";
            }
            if (norm.includes("/@tanstack/react-query/") || norm.includes("/axios/") || norm.includes("/swr/")) {
              return "vendor-data";
            }
            if (norm.includes("/leaflet/") || norm.includes("/@vis.gl/react-google-maps/")) {
              return "vendor-maps";
            }
            return "vendor";
          },
        },
      },
    },
    server: {
      host: true,
      fs: {
        allow: [path.resolve(__dirname, "..")],
      },
      port: 5173,
      // When Vite runs in Docker, the browser still connects to localhost:5173 for HMR.
      hmr: {
        clientPort: Number(env.VITE_HMR_CLIENT_PORT || process.env.VITE_HMR_CLIENT_PORT || 5173),
      },
      proxy: {
        "/socketcluster": {
          target: socketHost,
          ws: true,
          changeOrigin: true,
        },
        "/int/v1": { ...apiProxy },
        "/fleet-ops": {
          ...apiProxy,
          bypass(req) {
            const pathname = (req.url || "").split("?")[0];
            const accept = req.headers?.accept || "";
            // Vite bypass semantics: `false` → 404; string → rewrite and serve locally; undefined → proxy.
            if (shouldProxyFleetOpsRequest(pathname, accept)) {
              return;
            }
            if (String(accept).includes("text/html")) {
              return "/index.html";
            }
            return req.url;
          },
        },
        "/ledger": { ...apiProxy },
        "/storefront": { ...apiProxy },
        "/pallet": { ...apiProxy },
        "/registry": { ...apiProxy },
        "/~registry": { ...apiProxy },
        "/api/yms": { ...apiProxy },
        "/api/pms": { ...apiProxy },
      },
      watch: {
        usePolling,
        // Poll less aggressively in Docker so proxy requests are not starved.
        interval: usePolling ? Number(env.CHOKIDAR_INTERVAL || process.env.CHOKIDAR_INTERVAL || 1000) : undefined,
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
  };
});
