/**
 * Pure helper function formatting numeric amounts into Vietnamese Dong (VND).
 * E.g., 530000 -> "530.000 ₫"
 * @param amount Numeric value in VND
 * @returns Formatted currency string
 */
export function formatVND(amount: number | string | null | undefined): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  if (isNaN(numeric)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numeric);
}
