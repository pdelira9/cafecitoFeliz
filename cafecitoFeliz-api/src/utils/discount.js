/**
 * Regla de negocio (descuentos progresivos).
 * purchasesCount:
 * - 0 => 0%
 * - 1..3 => 5%
 * - 4..7 => 10%
 * - 8+ => 15%
 */
function calculateDiscountPercent(purchasesCount) {
  if (purchasesCount === 0) return 0;
  if (purchasesCount >= 1 && purchasesCount <= 3) return 5;
  if (purchasesCount >= 4 && purchasesCount <= 7) return 10;
  if (purchasesCount >= 8) return 15;
  return 0;
}

module.exports = { calculateDiscountPercent };
