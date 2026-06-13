import { Hono } from "hono";
import { cors } from "hono/cors";

import { handleHttpError } from "./lib/http-errors.js";
import type { AppBindings } from "./lib/hono.js";
import { registerRoutes } from "./router.js";

export const app = new Hono<AppBindings>();

const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  "/*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.onError(handleHttpError);

registerRoutes(app);
