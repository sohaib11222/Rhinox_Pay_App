/**
 * Shared crypto symbol helpers (unified USDT/USDC across networks).
 */

export function getBaseSymbol(currency: string): string {
  const upper = (currency || '').toUpperCase();
  if (upper === 'USDT' || upper.startsWith('USDT_')) {
    return 'USDT';
  }
  if (upper === 'USDC' || upper.startsWith('USDC_')) {
    return 'USDC';
  }
  return upper;
}

export function isUnifiedStable(symbol: string): boolean {
  const base = getBaseSymbol(symbol);
  return base === 'USDT' || base === 'USDC';
}

export function getUnifiedBalanceForSymbol(
  balancesData: { cryptoUnified?: Array<{ symbol: string; totalAvailable?: string; totalBalance?: string }> } | undefined,
  symbol: string
): string {
  const base = getBaseSymbol(symbol);
  const unified = balancesData?.cryptoUnified;
  if (!Array.isArray(unified)) {
    return '0';
  }
  const item = unified.find((u) => getBaseSymbol(u.symbol) === base);
  if (!item) {
    return '0';
  }
  return item.totalAvailable || item.totalBalance || '0';
}
