import * as Updates from 'expo-updates';

/**
 * Check for an OTA update and apply it immediately in production builds.
 * Skipped in development and when expo-updates is unavailable (Expo Go).
 */
export async function checkAndApplyOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) {
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      return;
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (error) {
    console.warn('[OTA] Update check failed:', error);
  }
}

export function getOtaDebugInfo() {
  return {
    isEnabled: Updates.isEnabled,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
