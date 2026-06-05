import { Hono } from "hono";
import { cors } from "hono/cors";

import { handleHttpError } from "./lib/http-errors.js";
import type { AppBindings } from "./lib/hono.js";
import { registerRoutes } from "./router.js";

export const app = new Hono<AppBindings>();

app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.onError(handleHttpError);

registerRoutes(app);
