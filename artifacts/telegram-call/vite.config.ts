import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

if (process.env.CF_PAGES === "1" || process.env.GITHUB_ACTIONS === "true") {
  const cfEnvFile = path.resolve(import.meta.dirname, ".env.cloudflare-pages");
  if (fs.existsSync(cfEnvFile)) {
    const lines = fs.readFileSync(cfEnvFile, "utf-8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m) {
        // The committed .env.cloudflare-pages is the SOURCE OF TRUTH for
        // static builds (Cloudflare Pages / GitHub Actions). Always apply it
        // (file wins). Everything here is public-by-design: the Supabase anon
        // key is protected by row-level security and the R2 base is public.
        process.env[m[1]] = m[2].trim();
      }
    }
  }
}

const port = Number(process.env.PORT || 21070);
const basePath = process.env.BASE_PATH || "/telegram-call/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
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
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
