# Administrator authentication

Admin web authentication uses JSON POST endpoints under `/api/auth/`. The
handwritten HTTP contract is `shared/auth/adminAuth.ts`. Public links keep their
UUID/passcode flow. GraphQL remains bearer-authenticated and does not consume the
refresh cookie. Media URLs retain the existing content-hash access model.

All auth POSTs require JSON and `x-picr-auth: 1`. Browser Origin headers must match
the effective request origin or `BASE_URL`; no CORS is enabled. Rejections log
the received, effective, and configured origins. Express applies the same
proxy-aware IP selection to REST and GraphQL authentication. Reverse proxies
must overwrite client-supplied forwarding headers. Refresh cookies are HttpOnly, SameSite=Strict,
Secure for HTTPS, and scoped to the deployment's `/api/auth` path. Local Vite
proxies rewrite the Origin to the configured backend; the production backend
override allows sign-in/session operations and security-status reads, but blocks
enrollment and security-setting writes.

Access JWTs contain a session ID, user ID and authentication version, never a
password hash or a TOTP secret. Authorization rechecks the account, session,
authentication version, enrolled factor and server policy. Legacy JWTs are
rejected. The GraphQL `auth` compatibility mutation cannot complete enrolled or
required 2FA logins. It issues a 28-day access token for current mobile apps;
normal web/native HTTP sign-in uses 15-minute access tokens. Both token paths
recheck the same database session, authentication version, and 2FA policy.

Refresh tokens are random opaque values stored as SHA256 hashes. Each rotation
consumes the old token; used hashes remain for a bounded 28-day replay-detection
window even if the session stays active. Older unknown tokens are rejected, but
no longer trigger family revocation because their association has been removed. Reuse revokes the session, except for a ten-second conflict window
that returns HTTP 409 without issuing credentials. Browsers coordinate with Web
Locks and retry a conflict once. Rotation never makes a consumed token valid
again. Background refresh can rotate without extending inactivity expiry.

Factor/session mutations lock `Users` first, then modify security/session rows.
Use the same transaction for inserts referencing that user. Failed login challenge
attempts are reserved before the verification transaction so rollback cannot erase
them. Challenges are single-use, five-minute opaque credentials, bound to the
account's authentication version and a purpose. Enrollment credentials authorize
only setup and confirmation, not normal GraphQL access.

TOTP uses otplib with six digits, SHA1, 30-second periods and a one-step clock
window. Persist the last accepted time step under the account lock. AES-256-GCM
binds the encrypted seed to its account via additional authenticated data.
Recovery codes have 80 bits of random entropy, are shown once, and are stored as
hashes; consumption uses the same account lock. A password reset preserves factors
and changes the authentication version. The local reset tool is the explicit
operator-controlled exception. It preserves server policy unless a root-scoped
admin is explicitly recovered with `--disable-policy`.

The first commit covers server/web only. The companion app must replace saved
passwords with SecureStore sessions and explicitly implement the HTTP challenge
contract. Native callers use `x-picr-client: native`; refresh tokens are returned
in responses and supplied in refresh/logout request bodies for SecureStore use.
Existing apps retain their 28-day password-only login until the companion app
implements refresh tokens and authenticator challenges.
Future passkey support should add a credential type and challenge method without
changing the session model.

The web uses `@urql/exchange-auth` for header injection, proactive refresh,
request queuing and a single retry after authentication failure. The small result
adapter in `frontend/src/urql/adminAuthExchange.ts` normalizes `me: null` and
blocks retry of partially successful mutations using parsed results and operation
kinds. It does not clone HTTP responses or parse outgoing query text. The global
error exchange runs above auth, so recoverable errors do not log the user out.
Token freshness uses the issued lifetime (`exp - iat`) and a monotonic timer
from receipt, avoiding repeated refreshes when a browser's wall clock is fast.
Cookie rotation, cross-tab Web Locks and HTTP settings requests remain in
`adminSession.ts`; native token storage will be implemented separately.

The web keys its GraphQL client by account identity, not access-token value.
Normal token rotation preserves cache and component state; a different account
gets a fresh cache. A rejected token (including a bootstrap `me: null`) gets one
forced refresh and retry to recover from browser clock skew. Partially successful
mutations are never replayed. Authentication endpoint responses are normalized
into typed errors even when a proxy returns HTML.

## Changelog text

Added optional authenticator-app two-factor authentication for administrator
accounts, with single-use recovery codes, guided setup, and a copyable manual
setup key. Server owners can require 2FA for all administrators. Sign-in now uses
renewable sessions that remain active while PICR is used within each 28-day
window, with secure refresh-token rotation and server-side logout. Public gallery
access is unchanged. Existing administrators will need to sign in again after
upgrading. To enable 2FA, configure `MFA_ENCRYPTION_KEY` or
`MFA_ENCRYPTION_KEY_FILE`; startup logs provide setup instructions when neither is
set. Back up the key with the database. Update the companion app alongside this
release to use renewable sessions and 2FA; existing password-only app logins retain
their 28-day lifetime. Downgrading
to a version without 2FA restores its password-only authentication behavior.
