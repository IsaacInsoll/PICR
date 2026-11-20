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
rejected. The GraphQL `auth` mutation has been removed. All administrator
sign-in uses HTTP and 15-minute access tokens with rotating refresh tokens.
Previously issued 28-day compatibility access tokens are rejected as well;
server upgrades require the updated companion app.

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

The companion app uses browser authentication and replaces saved passwords
with SecureStore sessions. Native callers use `x-picr-client: native`; refresh tokens are returned
in responses and supplied in refresh/logout request bodies for SecureStore use.
Older apps must be updated: their GraphQL password login and long-lived tokens
are no longer supported. The current app uses the native browser handoff below.
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
`adminSession.ts`; native token storage lives in the app's `useLoginDetails.ts`.

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
release to use renewable sessions and 2FA. The GraphQL password login mutation
and existing long-lived mobile tokens are no longer accepted. Downgrading
to a version without 2FA restores its password-only authentication behavior.

## Native browser sign-in

The companion app opens `/app-sign-in` in the system authentication browser.
The page reuses the web login, TOTP/recovery and required-enrollment screens.
After a fresh login it connects the app immediately; required enrollment waits
until recovery codes have been saved and the user chooses Done. Only an explicit
login-completion callback may skip confirmation. A restored browser session
shows a compact avatar/name confirmation with account switching and the server
URL above the continue button; token rotation or a query parameter must never trigger automatic
authorization. The browser remains a
separate session from the app. A native exchange must not set a refresh cookie.

The app generates a random verifier and state, sends only the S256 challenge,
and accepts only its exact callback and matching state. Backend callback URLs
are allowlisted as `picr://auth/callback` and `picrdev://auth/callback`. The
browser obtains a 60-second authorization code via authenticated JSON POST;
the database stores its hash, source session, challenge and callback. Exchanging
it verifies PKCE and the callback, rechecks the source session and current MFA
policy under the account lock, consumes the code atomically and creates a new
native session. Access tokens, refresh tokens and passwords are never placed in callback URLs.

App storage version 2 contains the server, access token and rotating refresh
token. Earlier saved passwords are removed, while the server and username are
kept for one fresh browser login. Refresh is serialized, uses foreground
activity for the 28-day inactivity window, and must preserve storage on network
errors. Client identity is the session ID, so token rotation preserves cache.
Logout and refresh storage writes must be ordered, with a final identity check
before publishing a refreshed session, to prevent an in-flight refresh from
restoring a signed-out account.
