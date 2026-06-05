import type { Context } from "hono";
import { z } from "zod";

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  c: Context,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const body = await c.req.json();

  return schema.parse(body);
}

export function parseParams<TSchema extends z.ZodTypeAny>(
  c: Context,
  schema: TSchema,
): z.infer<TSchema> {
  return schema.parse(c.req.param());
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  c: Context,
  schema: TSchema,
): z.infer<TSchema> {
  return schema.parse(c.req.query());
}
