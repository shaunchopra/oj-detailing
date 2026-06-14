import { z } from 'zod';

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request.';
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: formatZodError(result.error) };
  }
  return { data: result.data };
}
