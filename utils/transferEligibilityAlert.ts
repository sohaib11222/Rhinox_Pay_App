import { showAlert, showWarningAlert } from './customAlert';

export interface TransferEligibilityData {
  eligible?: boolean;
  reason?: string;
  message?: string;
}

const navigateToAccountSecurity = (navigation: any) => {
  try {
    navigation.navigate('AccountSecurity');
    return;
  } catch {
    // fall through
  }

  try {
    navigation.navigate('Settings', { screen: 'AccountSecurity' });
    return;
  } catch {
    // fall through
  }

  const settingsTab = navigation.getParent?.();
  settingsTab?.navigate?.('AccountSecurity');
};

const navigateToKyc = (navigation: any) => {
  const rootNavigation =
    navigation.getParent?.()?.getParent?.()?.getParent?.() ||
    navigation.getParent?.()?.getParent?.();

  if (rootNavigation?.navigate) {
    rootNavigation.navigate('Auth', { screen: 'KYC' });
    return;
  }

  navigation.navigate('Auth', { screen: 'KYC' });
};

const isPinEligibilityIssue = (eligibility?: TransferEligibilityData | null) => {
  const message = (eligibility?.message || '').toLowerCase();
  return (
    eligibility?.reason === 'PIN_NOT_SET' ||
    message.includes('setup your pin') ||
    message.includes('set up your pin') ||
    message.includes('pin not set')
  );
};

const isKycEligibilityIssue = (eligibility?: TransferEligibilityData | null) => {
  const message = (eligibility?.message || '').toLowerCase();
  return (
    eligibility?.reason === 'KYC_NOT_COMPLETE' ||
    message.includes('kyc') ||
    message.includes('verification')
  );
};

/**
 * Show the correct blocker alert for transfer eligibility (PIN vs KYC) with actionable CTAs.
 */
export const showTransferEligibilityAlert = (
  navigation: any,
  eligibility?: TransferEligibilityData | null
) => {
  const message =
    eligibility?.message || 'You cannot complete this transaction yet.';

  if (isPinEligibilityIssue(eligibility)) {
    showAlert({
      title: 'PIN Required',
      message,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set up PIN',
          onPress: () => navigateToAccountSecurity(navigation),
        },
      ],
    });
    return;
  }

  if (isKycEligibilityIssue(eligibility)) {
    showAlert({
      title: 'KYC Required',
      message,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete KYC',
          onPress: () => navigateToKyc(navigation),
        },
      ],
    });
    return;
  }

  showWarningAlert('Not Eligible', message);
};
