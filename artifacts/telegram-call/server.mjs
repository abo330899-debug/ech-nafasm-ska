import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 21070);
const BASE = (process.env.BASE_PATH || "/telegram-call/").replace(/\/$/, "");
const DIST = path.join(__dirname, "dist/public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

try {
  execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`, { stdio: "ignore" });
} catch (_) {}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    } else {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
      });
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  let url = req.url.split("?")[0];

  if (url === BASE || url === BASE + "/" || url.startsWith(BASE + "/")) {
    const localPath = url.slice(BASE.length) || "/";
    const hasExt = /\.[a-zA-Z0-9]+$/.test(localPath);

    if (hasExt) {
      const filePath = path.join(DIST, localPath);
      if (fs.existsSync(filePath)) {
        serveFile(filePath, res);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    } else {
      serveFile(path.join(DIST, "index.html"), res);
    }
  } else if (url === "/" || url === "") {
    res.writeHead(302, { Location: BASE + "/" });
    res.end();
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Telegram Call UI running at http://localhost:${PORT}${BASE}/`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM ignored - waiting for SIGKILL or manual stop");
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

setInterval(() => {}, 1 << 30);
