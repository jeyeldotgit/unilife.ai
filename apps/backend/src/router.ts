import { Hono } from "hono";

import { aiRouter } from "./routes/ai.route.js";
import type { AppBindings } from "./lib/hono.js";
import { assignmentsRouter } from "./routes/assignments.route.js";
import { budgetsRouter } from "./routes/budgets.route.js";
import { classesRouter } from "./routes/classes.route.js";
import { examsRouter } from "./routes/exams.route.js";
import { expensesRouter } from "./routes/expenses.route.js";
import { healthRouter } from "./routes/health.route.js";
import { profileRouter } from "./routes/profile.route.js";
import { syncRouter } from "./routes/sync.route.js";

export const apiRouter = new Hono<AppBindings>();

apiRouter.route("/classes", classesRouter);
apiRouter.route("/assignments", assignmentsRouter);
apiRouter.route("/exams", examsRouter);
apiRouter.route("/expenses", expensesRouter);
apiRouter.route("/budgets", budgetsRouter);
apiRouter.route("/profile", profileRouter);
apiRouter.route("/sync", syncRouter);
apiRouter.route("/ai", aiRouter);

export function registerRoutes(app: Hono<AppBindings>) {
  app.route("/", healthRouter);
  app.route("/api", apiRouter);
}
