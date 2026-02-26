import { calculateDiscountPercent } from './discount';

describe('calculateDiscountPercent', () => {
  it('should return 0% for new customer', () => {
    expect(calculateDiscountPercent(0)).toBe(0);
  });

  it('should return 5% for 1 to 3 purchases', () => {
    expect(calculateDiscountPercent(1)).toBe(5);
    expect(calculateDiscountPercent(3)).toBe(5);
  });

  it('should return 10% for 4 to 7 purchases', () => {
    expect(calculateDiscountPercent(4)).toBe(10);
    expect(calculateDiscountPercent(7)).toBe(10);
  });

  it('should return 15% for 8 or more purchases', () => {
    expect(calculateDiscountPercent(8)).toBe(15);
    expect(calculateDiscountPercent(100)).toBe(15);
  });
});