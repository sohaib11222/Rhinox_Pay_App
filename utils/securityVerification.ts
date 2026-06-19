/**
 * Security Verification Utility
 * Checks and handles security confirmation requirements before transactions
 */

import {
  getSecurityConfirmationSettings,
  SecurityConfirmationSettings,
} from './apiClient';
import apiClient from './apiClient';
import { API_ROUTES } from './apiConfig';

export interface SecurityVerificationResult {
  required: boolean;
  methods: {
    pin: boolean;
    email: boolean;
    twoFA: boolean;
  };
}

export type TransactionConfirmPayload = {
  transactionId: number;
  pin?: string;
  emailOtp?: string;
};

/**
 * Check which security verification methods are required
 */
export const checkSecurityRequirements = async (): Promise<SecurityVerificationResult> => {
  try {
    const settings = await getSecurityConfirmationSettings();
    
    return {
      required: settings.verifyWithPin || settings.verifyWithEmail || settings.verifyWith2FA,
      methods: {
        pin: settings.verifyWithPin,
        email: settings.verifyWithEmail,
        twoFA: settings.verifyWith2FA,
      },
    };
  } catch (error) {
    console.error('[checkSecurityRequirements] Error:', error);
    return {
      required: false,
      methods: {
        pin: false,
        email: false,
        twoFA: false,
      },
    };
  }
};

/**
 * Verify security requirements before transaction
 * Returns true if all required verifications are passed
 */
export const verifySecurityBeforeTransaction = async (
  providedVerifications: {
    pin?: string;
    emailOtp?: string;
    twoFACode?: string;
  }
): Promise<{ success: boolean; missingVerifications: string[] }> => {
  try {
    const requirements = await checkSecurityRequirements();
    
    if (!requirements.required) {
      return { success: true, missingVerifications: [] };
    }

    const missingVerifications: string[] = [];

    if (requirements.methods.pin) {
      if (!providedVerifications.pin || providedVerifications.pin.length < 5) {
        missingVerifications.push('PIN');
      }
    }

    if (requirements.methods.email) {
      if (!providedVerifications.emailOtp || providedVerifications.emailOtp.length < 5) {
        missingVerifications.push('Email OTP');
      }
    }

    if (requirements.methods.twoFA) {
      if (!providedVerifications.twoFACode || providedVerifications.twoFACode.length < 6) {
        missingVerifications.push('2FA Code');
      }
    }

    if (missingVerifications.length > 0) {
      return {
        success: false,
        missingVerifications,
      };
    }

    return { success: true, missingVerifications: [] };
  } catch (error) {
    console.error('[verifySecurityBeforeTransaction] Error:', error);
    return {
      success: false,
      missingVerifications: ['Unknown error occurred'],
    };
  }
};

export const getMissingVerificationMessage = (missingVerifications: string[]): string => {
  if (missingVerifications.length === 0) {
    return '';
  }

  if (missingVerifications.length === 1) {
    return `Please provide ${missingVerifications[0]} to complete this transaction.`;
  }

  const last = missingVerifications[missingVerifications.length - 1];
  const others = missingVerifications.slice(0, -1).join(', ');
  return `Please provide ${others} and ${last} to complete this transaction.`;
};

export const getSecurityVerificationSubtitle = (
  methods: SecurityVerificationResult['methods']
): string => {
  const parts: string[] = [];
  if (methods.pin) parts.push('PIN');
  if (methods.email) parts.push('email');
  if (methods.twoFA) parts.push('your authenticator app');

  if (parts.length === 0) {
    return 'Confirm your transaction';
  }
  if (parts.length === 1) {
    return `Verify via ${parts[0]}`;
  }
  if (parts.length === 2) {
    return `Verify via ${parts[0]} and ${parts[1]}`;
  }
  return `Verify via ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};

export async function proceedAfterTransactionInitiate(
  transactionId: number,
  callbacks: {
    showVerificationModal: () => void;
    confirm: (payload: TransactionConfirmPayload) => void;
  }
): Promise<void> {
  const requirements = await checkSecurityRequirements();

  if (!requirements.required) {
    callbacks.confirm({ transactionId });
    return;
  }

  if (requirements.methods.email) {
    try {
      await apiClient.post(API_ROUTES.AUTH.TRANSACTION_VERIFICATION_OTP);
    } catch (error) {
      console.error('[proceedAfterTransactionInitiate] Failed to send email OTP:', error);
    }
  }

  callbacks.showVerificationModal();
}

export async function runAfterSecurityCheck(callbacks: {
  showVerificationModal: () => void;
  onProceed: () => void;
}): Promise<void> {
  const requirements = await checkSecurityRequirements();

  if (!requirements.required) {
    callbacks.onProceed();
    return;
  }

  if (requirements.methods.email) {
    try {
      await apiClient.post(API_ROUTES.AUTH.TRANSACTION_VERIFICATION_OTP);
    } catch (error) {
      console.error('[runAfterSecurityCheck] Failed to send email OTP:', error);
    }
  }

  callbacks.showVerificationModal();
}

export async function afterPinEntryComplete(
  pin: string,
  callbacks: {
    onProceed: () => void;
    onShowAdditionalVerification: () => void;
    onInvalid?: (message: string) => void;
  }
): Promise<void> {
  const requirements = await checkSecurityRequirements();
  const verification = await verifySecurityBeforeTransaction({ pin });

  if (!verification.success) {
    callbacks.onInvalid?.(getMissingVerificationMessage(verification.missingVerifications));
    return;
  }

  if (requirements.methods.email || requirements.methods.twoFA) {
    if (requirements.methods.email) {
      try {
        await apiClient.post(API_ROUTES.AUTH.TRANSACTION_VERIFICATION_OTP);
      } catch (error) {
        console.error('[afterPinEntryComplete] Failed to send email OTP:', error);
      }
    }
    callbacks.onShowAdditionalVerification();
    return;
  }

  callbacks.onProceed();
}

export async function prepareTransactionConfirmPayload(
  transactionId: number,
  verifications: {
    pin?: string;
    emailOtp?: string;
    twoFACode?: string;
  }
): Promise<{ payload: TransactionConfirmPayload | null; errorMessage?: string }> {
  const verification = await verifySecurityBeforeTransaction(verifications);

  if (!verification.success) {
    return {
      payload: null,
      errorMessage: getMissingVerificationMessage(verification.missingVerifications),
    };
  }

  const settings = await getSecurityConfirmationSettings();

  return {
    payload: {
      transactionId,
      ...(settings.verifyWithPin && verifications.pin ? { pin: verifications.pin } : {}),
      ...(settings.verifyWithEmail && verifications.emailOtp
        ? { emailOtp: verifications.emailOtp }
        : {}),
    },
  };
}

export async function isTransactionConfirmEnabled(
  verifications: {
    pin?: string;
    emailOtp?: string;
    twoFACode?: string;
  }
): Promise<boolean> {
  const settings = await getSecurityConfirmationSettings();
  const pinOk = !settings.verifyWithPin || (verifications.pin?.length ?? 0) >= 5;
  const emailOk = !settings.verifyWithEmail || (verifications.emailOtp?.length ?? 0) >= 5;
  const twoFaOk = !settings.verifyWith2FA || (verifications.twoFACode?.length ?? 0) >= 6;
  return pinOk && emailOk && twoFaOk;
}

export type { SecurityConfirmationSettings };
