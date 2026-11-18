/** Dedicated admin-auth HTTP contract. Public gallery authentication is separate. */
export type AdminAuthResult =
  | { status: 'authenticated'; accessToken: string }
  | {
      status: 'second_factor_required' | 'enrollment_required';
      challenge: string;
    };

export interface AdminSecurityStatus {
  available: boolean;
  enabled: boolean;
  required: boolean;
  canManagePolicy: boolean;
  unenrolledAdmins: number;
  recoveryCodesRemaining: number;
}

export interface AuthenticatorSetup {
  secret: string;
  qrCode: string;
}

export const adminAuthErrorCodes = [
  'refresh_in_progress',
  'invalid_credentials',
  'invalid_code',
  'challenge_expired',
  'rate_limited',
  'mfa_unavailable',
  'enrollment_required',
  'invalid_request',
  'session_expired',
  'server_error',
] as const;
export type AdminAuthErrorCode = (typeof adminAuthErrorCodes)[number];
