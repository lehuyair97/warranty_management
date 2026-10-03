/**
 * Formats a spare part ID into standard alphanumeric SKU code: e.g. 1 -> "LK-0001".
 * Falls back gracefully to the generated code if partCode is empty or not in the database.
 */
export function formatPartCode(id: number, code?: string | null): string {
  if (code && typeof code === 'string' && code.trim().length > 0) {
    return code.trim();
  }
  return `LK-${id.toString().padStart(4, '0')}`;
}
