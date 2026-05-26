import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = new Set<string>();
      const domains = process.env.REPLIT_DOMAINS ?? "";
      for (const d of domains.split(",")) {
        const t = d.trim();
        if (t) allowed.add(`https://${t}`);
      }
      const devDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
      if (devDomain) allowed.add(`https://${devDomain}`);
      if (allowed.has(origin)) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" &&
        (origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1"))
      ) {
        return callback(null, true);
      }
      callback(null, false);
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(__dirname, "../../nafsam/dist/public");
  app.use(express.static(staticDir));
  app.get("*path", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
