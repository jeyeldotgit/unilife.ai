import type { Hono } from "hono";

import { healthRouter } from "./routes/health.route.js";

export function registerRoutes(app: Hono) {
  app.route("/", healthRouter);
}
