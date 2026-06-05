import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

if (process.env.CF_PAGES === "1") {
  const cfEnvFile = path.resolve(import.meta.dirname, ".env.cloudflare-pages");
  if (fs.existsSync(cfEnvFile)) {
    const lines = fs.readFileSync(cfEnvFile, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m) {
        // The committed .env.cloudflare-pages is the SOURCE OF TRUTH for the
        // static Cloudflare build. Always apply it (file wins) so a stale
        // Cloudflare dashboard environment variable can't silently override the
        // login word list (VITE_AUTH_TOKENS) or the static-mode flags baked
        // into the deployed bundle. Everything here is public-by-design.
        process.env[m[1]] = m[2].trim();
      }
    }
  }
}

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");

const port = Number(process.env.PORT || 19579);
const basePath = process.env.BASE_PATH || "/";

if (!isBuild) {
  if (!process.env.PORT) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  if (!process.env.BASE_PATH) {
    throw new Error("BASE_PATH environment variable is required but was not provided.");
  }
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
