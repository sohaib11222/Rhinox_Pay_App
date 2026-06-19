type ReadyKey = 'fonts' | 'auth' | 'onboarding';

const readyState: Record<ReadyKey, boolean> = {
  fonts: false,
  auth: false,
  onboarding: false,
};

let hideSplash: (() => void) | null = null;

export function registerSplashHide(callback: () => void) {
  hideSplash = callback;
}

export function markSplashReady(key: ReadyKey) {
  readyState[key] = true;
  if (readyState.fonts && readyState.auth && readyState.onboarding) {
    hideSplash?.();
  }
}

export function resetSplashReady() {
  readyState.auth = false;
  readyState.onboarding = false;
}
