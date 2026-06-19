import { showWarningAlert } from './customAlert';

export const NAIRA_COUNTRY_CODE = 'NG';
export const NAIRA_CURRENCY = 'NGN';

export function isNairaFiatSupported(countryCode?: string | null, currency?: string | null): boolean {
  const normalizedCountry = (countryCode || '').toUpperCase();
  const normalizedCurrency = (currency || '').toUpperCase();
  return normalizedCountry === NAIRA_COUNTRY_CODE || normalizedCurrency === NAIRA_CURRENCY;
}

export function showNairaOnlyComingSoon(featureLabel: string) {
  showWarningAlert(
    'Coming Soon',
    `${featureLabel} for other African currencies is coming soon. Only Naira (NGN) is available right now.`
  );
}

export function showMobileMoneyComingSoon() {
  showWarningAlert(
    'Coming Soon',
    'Mobile money is coming soon. Only Naira bank transfer is available right now.'
  );
}
