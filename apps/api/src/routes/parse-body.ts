import { z } from "zod";

async function parseBody<T extends z.ZodType>(c: any, schema: T) {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return {
      error: "Invalid JSON body",
      status: 400 as const,
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      error: "Validation failed",
      details: z.flattenError(result.error),
      status: 400 as const,
    };
  }

  return { data: result.data };
}

export { parseBody };
