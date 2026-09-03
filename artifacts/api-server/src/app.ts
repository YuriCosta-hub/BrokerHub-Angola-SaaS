import express, { type Express } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import { corsGuard } from "./lib/cors";
import { securityHeaders } from "./lib/securityHeaders";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

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

app.use(securityHeaders());
app.use(corsGuard());
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use((req, res, next) => {
  const largeJson =
    req.method === "POST" &&
    (req.path === "/api/documents" || req.path.endsWith("/documents"));
  express.json({ limit: largeJson ? "2mb" : "32kb" })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

const frontendDist = process.env.FRONTEND_DIST;
if (frontendDist && existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
