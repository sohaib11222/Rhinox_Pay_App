import { ImageSourcePropType } from 'react-native';
import { API_BASE_URL } from './apiConfig';

export const CURRENCY_COUNTRY_CODE: Record<string, string> = {
  NGN: 'NG',
  KES: 'KE',
  KSH: 'KE',
  GHS: 'GH',
  ZAR: 'ZA',
  TZS: 'TZ',
  UGX: 'UG',
  BWP: 'BW',
};

export const COUNTRY_FLAG_EMOJI: Record<string, string> = {
  NG: '🇳🇬',
  KE: '🇰🇪',
  GH: '🇬🇭',
  ZA: '🇿🇦',
  TZ: '🇹🇿',
  UG: '🇺🇬',
  BW: '🇧🇼',
};

export type CountryFlagRef = {
  code?: string | null;
  flag?: string | null;
};

export const normalizeFiatCurrency = (currency?: string | null): string =>
  (currency || '').toUpperCase() === 'KSH' ? 'KES' : (currency || '').toUpperCase();

/** Normalize backend/DB flag values to `/uploads/flags/<file>`. */
export const normalizeFlagPath = (flag: string): string => {
  const trimmed = flag.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/flags/')) {
    return trimmed;
  }
  if (trimmed.includes('/uploads/flags/')) {
    const idx = trimmed.lastIndexOf('/uploads/flags/');
    return trimmed.slice(idx);
  }
  const filename = trimmed.replace(/^\/+/, '').replace(/^uploads\/flags\//, '');
  return `/uploads/flags/${filename}`;
};

export const resolveFlagUri = (flag?: string | null): string | null => {
  if (!flag) return null;

  const path = normalizeFlagPath(flag);
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://') ||
    path.startsWith('content://')
  ) {
    return path;
  }

  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Resolve backend upload paths or local URIs to a displayable image URL */
export const resolveUploadUri = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('file://') || path.startsWith('content://')) {
    return path;
  }

  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  return `${baseUrl}/${path}`;
};

export const getCountryCodeForCurrency = (currency?: string | null): string | null => {
  if (!currency) return null;
  return CURRENCY_COUNTRY_CODE[normalizeFiatCurrency(currency)] || null;
};

export const getCountryForCurrency = (
  currency: string,
  countries: CountryFlagRef[]
): CountryFlagRef | undefined => {
  const countryCode = getCountryCodeForCurrency(currency);
  if (!countryCode) return undefined;
  return countries.find((entry) => (entry.code || '').toUpperCase() === countryCode);
};

export type WalletFlagDisplay =
  | { kind: 'image'; source: ImageSourcePropType }
  | { kind: 'emoji'; emoji: string };

export const getFiatWalletFlagDisplay = (
  currency: string,
  apiFlag?: string | null,
  countries: CountryFlagRef[] = []
): WalletFlagDisplay => {
  const normalizedCurrency = normalizeFiatCurrency(currency);
  const countryCode = getCountryCodeForCurrency(normalizedCurrency);

  if (countryCode && COUNTRY_FLAG_EMOJI[countryCode]) {
    return { kind: 'emoji', emoji: COUNTRY_FLAG_EMOJI[countryCode] };
  }

  const directUri = resolveFlagUri(apiFlag);
  if (directUri) {
    return { kind: 'image', source: { uri: directUri } };
  }

  const country = getCountryForCurrency(normalizedCurrency, countries);
  const countryUri = resolveFlagUri(country?.flag || null);
  if (countryUri) {
    return { kind: 'image', source: { uri: countryUri } };
  }

  return { kind: 'emoji', emoji: '🏳️' };
};

/** @deprecated Prefer WalletFlag component or getFiatWalletFlagDisplay */
export const getFiatWalletFlagSource = (
  currency: string,
  apiFlag?: string | null,
  countries: CountryFlagRef[] = []
): ImageSourcePropType => {
  const display = getFiatWalletFlagDisplay(currency, apiFlag, countries);
  if (display.kind === 'image') {
    return display.source;
  }
  return { uri: '' };
};
