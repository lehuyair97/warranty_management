/**
 * Pure helper function to compute final invoice total amount.
 * Formula: Math.max(0, laborFee + partsTotal - discountAmount)
 * @param laborFee Service fee charged for repair
 * @param partsTotal Sum of all spare part prices
 * @param discountAmount Promotional or warranty coverage discount
 * @returns Final payable amount (cannot be negative)
 */
export function calculateInvoiceTotal(
  laborFee: number,
  partsTotal: number,
  discountAmount: number = 0,
): number {
  const safeLabor = Number.isFinite(laborFee) && laborFee > 0 ? laborFee : 0;
  const safeParts = Number.isFinite(partsTotal) && partsTotal > 0 ? partsTotal : 0;
  const safeDiscount = Number.isFinite(discountAmount) && discountAmount > 0 ? discountAmount : 0;

  const total = safeLabor + safeParts - safeDiscount;
  return total < 0 ? 0 : Math.round(total * 100) / 100;
}
