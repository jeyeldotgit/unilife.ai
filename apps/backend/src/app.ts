import { Hono } from "hono";
import { cors } from "hono/cors";

import { registerRoutes } from "./router.js";

export const app = new Hono();

app.use(
  "/*",
  cors({
    origin: process.env.FRONTEND_URL ?? "*",
    credentials: true,
  }),
);

registerRoutes(app);
