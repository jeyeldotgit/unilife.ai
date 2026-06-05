import { Hono } from "hono";

import type { AppBindings } from "./lib/hono.js";
import { assignmentsRouter } from "./routes/assignments.route.js";
import { classesRouter } from "./routes/classes.route.js";
import { examsRouter } from "./routes/exams.route.js";
import { healthRouter } from "./routes/health.route.js";

export const apiRouter = new Hono<AppBindings>();

apiRouter.route("/classes", classesRouter);
apiRouter.route("/assignments", assignmentsRouter);
apiRouter.route("/exams", examsRouter);

export function registerRoutes(app: Hono<AppBindings>) {
  app.route("/", healthRouter);
  app.route("/api", apiRouter);
}
