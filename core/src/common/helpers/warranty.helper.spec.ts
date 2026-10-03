import { checkIsUnderWarranty } from './warranty.helper';

describe('WarrantyHelper - checkIsUnderWarranty', () => {
  it('should return false if isUnderWarranty flag is false', () => {
    const expiry = new Date('2027-12-31');
    const result = checkIsUnderWarranty(false, expiry, new Date('2026-10-02'));
    expect(result).toBe(false);
  });

  it('should return false if expiryDate is null or undefined', () => {
    expect(checkIsUnderWarranty(true, null)).toBe(false);
    expect(checkIsUnderWarranty(true, undefined)).toBe(false);
  });

  it('should return false if expiryDate is in the past', () => {
    const expiredDate = new Date('2025-01-01');
    const today = new Date('2026-10-02');
    const result = checkIsUnderWarranty(true, expiredDate, today);
    expect(result).toBe(false);
  });

  it('should return true if expiryDate is in the future', () => {
    const futureDate = new Date('2027-06-15');
    const today = new Date('2026-10-02');
    const result = checkIsUnderWarranty(true, futureDate, today);
    expect(result).toBe(true);
  });

  it('should return true if expiryDate is today (same day comparison)', () => {
    const today = new Date('2026-10-02T08:00:00Z');
    const expiryToday = new Date('2026-10-02T23:59:59Z');
    const result = checkIsUnderWarranty(true, expiryToday, today);
    expect(result).toBe(true);
  });

  it('should handle ISO date string properly', () => {
    const result = checkIsUnderWarranty(true, '2027-11-20', new Date('2026-10-02'));
    expect(result).toBe(true);
  });
});
