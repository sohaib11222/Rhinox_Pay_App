export const NAIRA_SYMBOL = '₦';

export const parseQuickAmountValue = (label: string): string =>
  label.replace(/[₦N,\s]/g, '');

export const formatNaira = (
  amount: string | number,
  options?: { decimals?: number; compact?: boolean }
): string => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (Number.isNaN(num)) {
    return `${NAIRA_SYMBOL}0`;
  }

  if (options?.compact) {
    return `${NAIRA_SYMBOL}${num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  const decimals = options?.decimals ?? 2;
  return `${NAIRA_SYMBOL}${num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const QUICK_AMOUNT_LABELS = ['₦100', '₦200', '₦500', '₦1,000'] as const;
