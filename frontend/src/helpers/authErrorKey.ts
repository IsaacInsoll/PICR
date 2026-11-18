import { AuthRequestError } from './adminSession';

export const authErrorKey = (error: unknown) => {
  const code = error instanceof AuthRequestError ? error.code : 'server_error';
  switch (code) {
    case 'invalid_credentials':
      return 'security.error.invalid_credentials';
    case 'invalid_code':
      return 'security.error.invalid_code';
    case 'challenge_expired':
      return 'security.error.challenge_expired';
    case 'rate_limited':
      return 'security.error.rate_limited';
    case 'mfa_unavailable':
      return 'security.error.mfa_unavailable';
    case 'enrollment_required':
      return 'security.error.enrollment_required';
    case 'session_expired':
      return 'security.error.session_expired';
    case 'network_error':
      return 'security.error.network_error';
    case 'invalid_request':
    case 'refresh_in_progress':
    case 'server_error':
      return 'security.error.server_error';
  }
};
