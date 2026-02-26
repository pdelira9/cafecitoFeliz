export function calculateDiscountPercent(purchasesCount: number): number {
  if (purchasesCount === 0) return 0;
  if (purchasesCount >= 1 && purchasesCount <= 3) return 5;
  if (purchasesCount >= 4 && purchasesCount <= 7) return 10;
  return 15;
}
