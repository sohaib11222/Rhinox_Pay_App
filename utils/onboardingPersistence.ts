import AsyncStorage from '@react-native-async-storage/async-storage';
import { HAS_SEEN_ONBOARDING_KEY } from '../constants/onboarding';

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, 'true');
  } catch {
    // non-blocking
  }
}
