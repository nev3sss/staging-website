/**
 * lib/ids.ts — ID generation. No sequential IDs.
 * Format: {prefix}-{uuid-v4}  e.g. "org-550e8400-e29b-41d4-a716-446655440000"
 */

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
