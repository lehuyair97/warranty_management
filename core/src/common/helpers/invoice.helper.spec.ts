import { calculateInvoiceTotal } from './invoice.helper';

describe('InvoiceHelper - calculateInvoiceTotal', () => {
  it('should calculate total with labor fee and parts cost without discount', () => {
    const total = calculateInvoiceTotal(150000, 450000, 0);
    expect(total).toBe(600000);
  });

  it('should apply discount amount correctly', () => {
    const total = calculateInvoiceTotal(200000, 500000, 100000);
    expect(total).toBe(600000);
  });

  it('should not return negative total if discount exceeds sum', () => {
    const total = calculateInvoiceTotal(100000, 200000, 500000);
    expect(total).toBe(0);
  });

  it('should handle zero or negative input parameters safely', () => {
    expect(calculateInvoiceTotal(0, 0, 0)).toBe(0);
    expect(calculateInvoiceTotal(-50000, 100000, 0)).toBe(100000);
    expect(calculateInvoiceTotal(100000, -20000, 0)).toBe(100000);
  });
});
