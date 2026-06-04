import "dotenv/config";

import { db } from "@unilife-ai/database";

export class HealthRepository {
  async isDatabaseReachable(): Promise<boolean> {
    try {
      const res = await db.query.users.findFirst();
      return res !== null;
    } catch (error) {
      console.error("Database health check failed.", error);

      return false;
    }
  }
}
