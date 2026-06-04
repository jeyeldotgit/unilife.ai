import type { Context } from "hono";

import type { HealthService } from "../services/health.service.js";

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (c: Context) => {
    const payload = await this.healthService.getHealthStatus();

    return c.json(payload, 200);
  };
}
