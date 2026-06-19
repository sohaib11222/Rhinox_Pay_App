import AsyncStorage from '@react-native-async-storage/async-storage';

const BANKS_CACHE_PREFIX = 'banks_cache_v1';

export type CachedBank = {
  name: string;
  bankName: string;
  bankCode: string;
  code: string;
  logoUrl?: string;
  countryCode: string;
  currency: string;
};

type BanksCacheEntry = {
  savedAt: number;
  banks: CachedBank[];
};

function getCacheKey(countryCode = 'NG', currency = 'NGN') {
  return `${BANKS_CACHE_PREFIX}_${countryCode}_${currency}`;
}

export async function getCachedBanks(
  countryCode = 'NG',
  currency = 'NGN'
): Promise<CachedBank[] | null> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(countryCode, currency));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as BanksCacheEntry;
    if (!Array.isArray(parsed.banks) || parsed.banks.length === 0) {
      return null;
    }

    return parsed.banks;
  } catch (error) {
    console.warn('[bankListCache] Failed to read cache:', error);
    return null;
  }
}

export async function setCachedBanks(
  banks: CachedBank[],
  countryCode = 'NG',
  currency = 'NGN'
): Promise<void> {
  try {
    if (!banks.length) return;

    const entry: BanksCacheEntry = {
      savedAt: Date.now(),
      banks,
    };
    await AsyncStorage.setItem(getCacheKey(countryCode, currency), JSON.stringify(entry));
  } catch (error) {
    console.warn('[bankListCache] Failed to write cache:', error);
  }
}
