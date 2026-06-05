import { Hono } from "hono";

import { HealthController } from "../controllers/health.controller.js";
import type { AppBindings } from "../lib/hono.js";
import { HealthRepository } from "../repositories/health.repository.js";
import { HealthService } from "../services/health.service.js";

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

export const healthRouter = new Hono<AppBindings>();

healthRouter.get("/health", healthController.getHealth);
