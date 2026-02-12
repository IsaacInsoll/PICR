export const standardErrorCodes = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'BAD_USER_INPUT',
] as const;

export type StandardErrorCode = (typeof standardErrorCodes)[number];

export const globalAuthErrorActions = [
  'global_no_permissions',
  'logout',
  'local_only',
] as const;

export type GlobalAuthErrorAction = (typeof globalAuthErrorActions)[number];

export const AUTH_REASON = {
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  ACCESS_DENIED: 'ACCESS_DENIED',
  INVALID_LINK: 'INVALID_LINK',
  NOT_A_USER: 'NOT_A_USER',
  COMMENTS_NOT_ALLOWED: 'COMMENTS_NOT_ALLOWED',
  COMMENTS_HIDDEN: 'COMMENTS_HIDDEN',
  INVALID_HERO_IMAGE: 'INVALID_HERO_IMAGE',
  INVALID_HERO_IMAGE_TYPE: 'INVALID_HERO_IMAGE_TYPE',
  HERO_IMAGE_OUT_OF_SCOPE: 'HERO_IMAGE_OUT_OF_SCOPE',
} as const;

export const authErrorCatalog = {
  [AUTH_REASON.NOT_LOGGED_IN]: {
    code: 'UNAUTHENTICATED',
    message: 'Not logged in',
    globalAction: 'logout',
  },
  [AUTH_REASON.ACCESS_DENIED]: {
    code: 'FORBIDDEN',
    message: 'Access denied',
    globalAction: 'global_no_permissions',
  },
  [AUTH_REASON.INVALID_LINK]: {
    code: 'FORBIDDEN',
    message: 'Invalid public link',
    globalAction: 'global_no_permissions',
  },
  [AUTH_REASON.NOT_A_USER]: {
    code: 'FORBIDDEN',
    message: 'Not a user',
    globalAction: 'global_no_permissions',
  },
  [AUTH_REASON.COMMENTS_NOT_ALLOWED]: {
    code: 'FORBIDDEN',
    message: 'Commenting is not allowed for this user',
    globalAction: 'global_no_permissions',
  },
  [AUTH_REASON.COMMENTS_HIDDEN]: {
    code: 'FORBIDDEN',
    message: 'Comments are hidden for this user',
    globalAction: 'global_no_permissions',
  },
  [AUTH_REASON.INVALID_HERO_IMAGE]: {
    code: 'BAD_USER_INPUT',
    message: 'Hero image does not exist',
    globalAction: 'local_only',
  },
  [AUTH_REASON.INVALID_HERO_IMAGE_TYPE]: {
    code: 'BAD_USER_INPUT',
    message: 'Hero image must be an image file',
    globalAction: 'local_only',
  },
  [AUTH_REASON.HERO_IMAGE_OUT_OF_SCOPE]: {
    code: 'BAD_USER_INPUT',
    message: 'Hero image is outside this folder',
    globalAction: 'local_only',
  },
} as const satisfies Record<
  string,
  {
    code: StandardErrorCode;
    message: string;
    globalAction: GlobalAuthErrorAction;
  }
>;

export type AuthErrorReason = keyof typeof authErrorCatalog;

export const authErrorReasons = Object.keys(authErrorCatalog) as AuthErrorReason[];

const authReasonSet = new Set<string>(authErrorReasons);

export const isAuthErrorReason = (value: unknown): value is AuthErrorReason =>
  typeof value === 'string' && authReasonSet.has(value);
