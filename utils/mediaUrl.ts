import { API_BASE_URL } from './apiConfig';

export function resolveCountryFlagUrl(flag?: string | null): string | null {
  if (!flag) return null;
  if (flag.startsWith('http://') || flag.startsWith('https://')) return flag;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  const normalized = flag.startsWith('/') ? flag : `/${flag}`;
  return `${origin}${normalized}`;
}
