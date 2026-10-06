export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const cleanName = (value: string) => value.trim().replace(/\s+/g, ` `);
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === `object` && value !== null && !Array.isArray(value);

export const omitUndefined = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const errorMessage = (error: unknown, fallback = `Something Went Wrong`) =>
  error instanceof Error ? error.message : fallback;
