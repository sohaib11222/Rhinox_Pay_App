import { OTP_LENGTH } from '../constants/otp';

export type PasswordRuleKey =
  | 'minLength'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'symbol'
  | 'noPersonalInfo';

export type PasswordValidation = Record<PasswordRuleKey, boolean>;

export const PASSWORD_RULE_LABELS: Record<PasswordRuleKey, string> = {
  minLength: 'At least 8 characters',
  uppercase: 'Include an uppercase letter',
  lowercase: 'Include a lowercase letter',
  number: 'Include a number',
  symbol: 'Add a symbol (!@#$…)',
  noPersonalInfo: 'Must not contain your name or email',
};

export function validatePassword(
  password: string,
  context?: { firstName?: string; lastName?: string; email?: string }
): PasswordValidation {
  const lower = password.toLowerCase();
  const first = (context?.firstName || '').trim().toLowerCase();
  const last = (context?.lastName || '').trim().toLowerCase();
  const email = (context?.email || '').trim().toLowerCase();
  const emailLocal = email.split('@')[0] || '';

  let noPersonalInfo = true;
  if (first && first.length >= 2 && lower.includes(first)) noPersonalInfo = false;
  if (last && last.length >= 2 && lower.includes(last)) noPersonalInfo = false;
  if (emailLocal && emailLocal.length >= 3 && lower.includes(emailLocal)) noPersonalInfo = false;

  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^a-zA-Z0-9]/.test(password),
    noPersonalInfo,
  };
}

export function isPasswordValid(validation: PasswordValidation): boolean {
  return Object.values(validation).every(Boolean);
}

export function firstFailedPasswordHint(validation: PasswordValidation): string | null {
  for (const key of Object.keys(PASSWORD_RULE_LABELS) as PasswordRuleKey[]) {
    if (!validation[key]) {
      return PASSWORD_RULE_LABELS[key];
    }
  }
  return null;
}
