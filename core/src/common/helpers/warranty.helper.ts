/**
 * Pure helper function to determine if a device is under valid warranty.
 * @param isUnderWarranty Flag indicating warranty status
 * @param expiryDate Expiry date of warranty
 * @param targetDate The date to evaluate warranty against (defaults to now)
 * @returns boolean true if warranty is active and not expired
 */
export function checkIsUnderWarranty(
  isUnderWarranty: boolean,
  expiryDate: Date | string | null | undefined,
  targetDate: Date = new Date(),
): boolean {
  if (!isUnderWarranty || !expiryDate) {
    return false;
  }

  const parsedExpiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  if (isNaN(parsedExpiry.getTime())) {
    return false;
  }

  // Normalize dates to midnight for fair date-only comparison
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const expiryDay = new Date(parsedExpiry.getFullYear(), parsedExpiry.getMonth(), parsedExpiry.getDate()).getTime();

  return expiryDay >= targetDay;
}
