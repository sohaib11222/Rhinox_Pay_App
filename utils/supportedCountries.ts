export const SUPPORTED_AFRICAN_COUNTRY_CODES = ['NG', 'KE', 'GH', 'ZA', 'BW', 'TZ', 'UG'] as const;

export const SUPPORTED_AFRICAN_FIAT_CURRENCIES = ['NGN', 'KES', 'GHS', 'ZAR', 'TZS', 'UGX'] as const;

export const EXCLUDED_FIAT_CURRENCIES = ['USD', 'EUR'] as const;

export const DEFAULT_COUNTRY_CODE = 'NG';

export const DEFAULT_COUNTRY_NAME = 'Nigeria';

export type CountryLike = {
  id?: number;
  name?: string | null;
  code?: string | null;
};

export function isSupportedAfricanCountry(code?: string | null): boolean {
  if (!code) return false;
  return (SUPPORTED_AFRICAN_COUNTRY_CODES as readonly string[]).includes(code.toUpperCase());
}

export function isSupportedAfricanFiatCurrency(currency?: string | null): boolean {
  if (!currency) return false;
  return (SUPPORTED_AFRICAN_FIAT_CURRENCIES as readonly string[]).includes(currency.toUpperCase());
}

export function isSelectableFiatWallet(currency?: string | null): boolean {
  if (!currency) return false;
  const normalized = currency.toUpperCase();
  if ((EXCLUDED_FIAT_CURRENCIES as readonly string[]).includes(normalized)) {
    return false;
  }
  return isSupportedAfricanFiatCurrency(normalized);
}

export function filterSupportedCountries<T extends CountryLike>(countries: T[]): T[] {
  return countries.filter((country) => isSupportedAfricanCountry(country.code));
}

export function getDefaultCountry<T extends CountryLike>(countries: T[]): T | undefined {
  return (
    countries.find((country) => country.code === DEFAULT_COUNTRY_CODE) ||
    countries.find((country) => isSupportedAfricanCountry(country.code))
  );
}

export function resolveUserCountry<T extends CountryLike>(
  userCountry: T | null | undefined,
  countries: T[]
): T {
  if (userCountry && isSupportedAfricanCountry(userCountry.code)) {
    return userCountry;
  }

  const fallback = getDefaultCountry(countries);
  if (fallback) {
    return fallback;
  }

  return {
    id: 0,
    name: DEFAULT_COUNTRY_NAME,
    code: DEFAULT_COUNTRY_CODE,
  } as T;
}

export function getCurrencyFromSupportedCountryCode(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    NG: 'NGN',
    KE: 'KES',
    GH: 'GHS',
    ZA: 'ZAR',
    BW: 'BWP',
    TZ: 'TZS',
    UG: 'UGX',
  };
  return currencyMap[countryCode.toUpperCase()] || 'NGN';
}

/** Offline fallback when /countries API is unavailable */
export const FALLBACK_COUNTRIES: CountryLike[] = [
  { id: 1, name: 'Nigeria', code: 'NG' },
  { id: 2, name: 'Ghana', code: 'GH' },
  { id: 3, name: 'Kenya', code: 'KE' },
  { id: 4, name: 'South Africa', code: 'ZA' },
  { id: 5, name: 'Botswana', code: 'BW' },
  { id: 6, name: 'Tanzania', code: 'TZ' },
  { id: 7, name: 'Uganda', code: 'UG' },
];
