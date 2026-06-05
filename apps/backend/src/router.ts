import { Hono } from "hono";

import type { AppBindings } from "./lib/hono.js";
import { healthRouter } from "./routes/health.route.js";

export const apiRouter = new Hono<AppBindings>();

export function registerRoutes(app: Hono<AppBindings>) {
  app.route("/", healthRouter);
  app.route("/api", apiRouter);
}
