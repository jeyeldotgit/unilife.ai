export class HealthRepository {
  async isDatabaseReachable(): Promise<boolean> {
    try {
      return Boolean(process.env.DATABASE_URL);
    } catch (error) {
      console.error("Database health check failed.", error);

      return false;
    }
  }
}
