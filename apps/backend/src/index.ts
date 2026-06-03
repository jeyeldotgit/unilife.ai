import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { db } from "@unilife-ai/database";

// 1. Ensure this function returns the result
const testDbConnection = async () => {
  try {
    const result = await db.query.exams.findFirst();
    console.log("Database connection successful:", result);
    return result; // <-- Added return statement
  } catch (error) {
    console.error("Database connection failed:", error);
    return { error: "Failed to connect to database" };
  }
};

const app = new Hono();

// 2. Make this callback async and use "await"
app.get("/", async (c) => {
  const testResult = await testDbConnection(); // <-- Added await
  return c.json({ message: "Hello, UniLife.AI Backend!", dbTest: testResult });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
