/**
 * Formats numeric ticket ID into standard alphanumeric code: e.g. 1 -> "TK-0001".
 */
export function formatTicketCode(id: number): string {
  return `TK-${id.toString().padStart(4, '0')}`;
}

/**
 * Parses user search input into numeric ticket ID if it resembles a ticket code.
 */
export function parseTicketCode(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  const digits = input.replace(/[^0-9]/g, '');
  if (!digits) {
    return null;
  }
  const parsed = parseInt(digits, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
