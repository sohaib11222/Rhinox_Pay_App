import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'rhinox_device_id';

function generateDeviceId(): string {
  return `rn_${Platform.OS}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) return existing;
    const created = generateDeviceId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return generateDeviceId();
  }
}
