/**
 * Security Verification Utility
 * Checks and handles security confirmation requirements before transactions
 */

import { Alert } from 'react-native';
import { getSecurityConfirmationSettings, SecurityConfirmationSettings } from './apiClient';

export interface SecurityVerificationResult {
  required: boolean;
  methods: {
    pin: boolean;
    email: boolean;
    twoFA: boolean;
  };
}

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
      // No security requirements, proceed
      return { success: true, missingVerifications: [] };
    }

    const missingVerifications: string[] = [];

    // Check PIN requirement
    if (requirements.methods.pin) {
      if (!providedVerifications.pin || providedVerifications.pin.length < 4) {
        missingVerifications.push('PIN');
      }
    }

    // Check Email OTP requirement
    if (requirements.methods.email) {
      if (!providedVerifications.emailOtp || providedVerifications.emailOtp.length < 5) {
        missingVerifications.push('Email OTP');
      }
    }

    // Check 2FA requirement
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

/**
 * Get user-friendly message for missing verifications
 */
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

