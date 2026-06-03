import { serve } from "@hono/node-server";
import { Hono } from "hono";

import type { User } from "@unilife-ai/types";

const user1: User = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "John Doe",
  display_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg",
  created_at: "april 20",
  updated_at: "2023-01-01T00:00:00Z",
};

const app = new Hono();

app.get("/", (c) => {
  const jsonifiedUser = JSON.stringify(user1);
  return c.text(jsonifiedUser, 200, { "Content-Type": "application/json" });
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
