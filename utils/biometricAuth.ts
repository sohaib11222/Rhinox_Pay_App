import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  getAccessToken,
  hasStoredAuthSession,
  refreshAccessToken,
  setBiometricLocked,
} from './apiClient';

export type BiometricCapability = {
  isAvailable: boolean;
  type: string | null;
  isFingerprint: boolean;
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { isAvailable: false, type: null, isFingerprint: false };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { isAvailable: false, type: null, isFingerprint: false };
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isFingerprint = supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT
    );

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return { isAvailable: true, type: 'Face ID', isFingerprint };
    }
    if (isFingerprint) {
      return { isAvailable: true, type: 'Fingerprint', isFingerprint: true };
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return { isAvailable: true, type: 'Iris', isFingerprint: false };
    }

    return { isAvailable: true, type: 'Biometric', isFingerprint };
  } catch (error) {
    console.error('[biometricAuth] Error checking capability:', error);
    return { isAvailable: false, type: null, isFingerprint: false };
  }
}

export function getBiometricPromptMessage(
  capability: BiometricCapability,
  purpose: 'login' | 'enable'
): string {
  if (purpose === 'enable') {
    if (Platform.OS === 'android' && capability.isFingerprint) {
      return 'Scan your fingerprint to enable biometric login';
    }
    return `Verify your ${capability.type ?? 'biometric'} to enable login`;
  }

  if (Platform.OS === 'android' && capability.isFingerprint) {
    return 'Scan your fingerprint to login';
  }
  return `Authenticate with your ${capability.type ?? 'biometric'} to login`;
}

export async function promptBiometricAuth(options?: {
  promptMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const capability = await getBiometricCapability();
    if (!capability.isAvailable) {
      return { success: false, error: 'not_available' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options?.promptMessage ?? getBiometricPromptMessage(capability, 'login'),
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return { success: true };
    }

    return { success: false, error: result.error ?? 'auth_failed' };
  } catch (error) {
    console.error('[biometricAuth] Authentication error:', error);
    return { success: false, error: 'unknown' };
  }
}

export async function hasStoredBiometricSession(): Promise<boolean> {
  return hasStoredAuthSession();
}

export async function restoreSessionFromStorage(): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (accessToken) {
    return accessToken;
  }
  return refreshAccessToken();
}

export async function verifyBiometricToEnableLogin(): Promise<{
  ok: boolean;
  error?: 'not_available' | 'no_session' | 'auth_failed' | 'user_cancel' | 'unknown';
}> {
  const capability = await getBiometricCapability();
  if (!capability.isAvailable) {
    return { ok: false, error: 'not_available' };
  }

  const hasSession = await hasStoredBiometricSession();
  if (!hasSession) {
    return { ok: false, error: 'no_session' };
  }

  const authResult = await promptBiometricAuth({
    promptMessage: getBiometricPromptMessage(capability, 'enable'),
  });

  if (authResult.success) {
    await setBiometricLocked(false);
    return { ok: true };
  }

  if (authResult.error === 'user_cancel') {
    return { ok: false, error: 'user_cancel' };
  }

  return { ok: false, error: 'auth_failed' };
}
