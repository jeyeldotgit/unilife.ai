import type { HealthRepository } from "../repositories/health.repository.js";

export type HealthStatus = {
  ok: boolean;
  timestamp: string;
  database: "up" | "down";
};

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const databaseReachable = await this.healthRepository.isDatabaseReachable();

    return {
      ok: true,
      timestamp: new Date().toISOString(),
      database: databaseReachable ? "up" : "down",
    };
  }
}
