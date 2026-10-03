/**
 * Formats date to standard DD/MM/YYYY.
 * @param date ISO string or Date
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return '—';
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '—';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats date and time to DD/MM/YYYY HH:mm.
 * @param date ISO string or Date
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) {
    return '—';
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '—';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Calculates elapsed days since a given date.
 */
export function getDaysDifference(fromDate: string | Date): number {
  const start = new Date(fromDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
