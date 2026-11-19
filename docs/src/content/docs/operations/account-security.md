---
title: Account security
description: Protect administrator accounts with authenticator codes, recovery codes, and renewable sessions.
---

PICR supports authenticator-app two-factor authentication (2FA) for administrator accounts. Public gallery visitors continue to use their gallery links and passcodes; administrator security settings do not change that flow.

## Configure the encryption key

2FA is optional. Existing installations continue to start and accept password logins without a new environment variable. Enrollment and server-wide enforcement become available once the operator configures an encryption key.

On every startup without a key, PICR prints a newly generated **suggested** `MFA_ENCRYPTION_KEY` assignment in its container logs. Copy that assignment into your container environment and restart PICR. The suggestion is not active until you save it; PICR does not automatically store it or encrypt anything with it.

Alternatively, generate your own 32-byte key:

```sh
openssl rand -hex 32
```

Choose exactly one configuration method:

- `MFA_ENCRYPTION_KEY`: the generated 64-character hexadecimal value.
- `MFA_ENCRYPTION_KEY_FILE`: the container path to a mounted secret file containing that value. A trailing newline is accepted.

For example, with a Docker Compose secret:

```yaml
services:
  picr:
    environment:
      MFA_ENCRYPTION_KEY_FILE: /run/secrets/picr_mfa_key
    secrets:
      - picr_mfa_key

secrets:
  picr_mfa_key:
    file: ./picr-mfa-key.txt
```

Merge these entries into your existing Compose file. Keep the key file private and outside version control. The key encrypts stored authenticator secrets and is separate from PICR's JWT signing secret.

:::caution[Back up the key]
Back up the configured key alongside your database and preserve it when replacing containers. Do not replace it with a new startup suggestion after enrolling accounts. Changing or losing it prevents verification of existing authenticator codes. Missing configuration never disables an enrolled account's 2FA automatically. Restore the original key, or use local administrator recovery.
:::

## Enable 2FA on your account

1. Open **Settings → Users & Security** in the web interface.
2. Choose **Enable two-factor authentication** and confirm your password.
3. Scan the QR code in your authenticator app. For a desktop authenticator, choose **View setup key**, then **Copy setup key**, and enter it manually.
4. Enter the six-digit code from the app to confirm enrollment. Setup expires after five minutes; start again if needed.
5. Copy or download the ten recovery codes and store them somewhere safe outside PICR. Confirm that you saved them to finish.

2FA becomes active only after a code is verified. Other existing sessions are invalidated. The setup key is as sensitive as the QR code: anyone with it can generate your authenticator codes.

At future sign-ins, enter your username and password, then an authenticator code. A code cannot be reused after successful verification; wait for the next code if you just used one for another security operation. Keep the server and authenticator device clocks synchronized.

## Recovery codes and security changes

Choose **Use a recovery code instead** at the login code screen if your authenticator is unavailable. Each recovery code works once and still requires your password.

Use **Replace recovery codes** in **Settings → Users & Security** to generate a new set. Replacing the codes requires your password and a fresh authenticator or recovery code, invalidates the previous set, and signs out other sessions. Disabling 2FA also requires both factors. Password changes do not remove 2FA.

## Require 2FA for administrators

An administrator whose home folder is the media root can enable **Require 2FA for all admins** under **Settings → Users & Security**. Configure the encryption key and enroll that administrator first.

The confirmation shows the number of enabled administrators who have not enrolled. Enforcement takes effect immediately, including for existing sessions. Unenrolled administrators must sign in and finish a restricted enrollment flow before accessing normal administrator screens or data. Gallery recipients are unaffected.

Administrators cannot disable their own 2FA while enforcement is active. A root-scoped administrator can make 2FA optional again after confirming their password and a fresh code.

## Sessions

Access tokens last 15 minutes. The web interface renews them silently using a rotating refresh token in an HttpOnly cookie. Sessions expire after **28 days of inactivity**; using PICR keeps the session renewable. Background polling alone does not continually extend the inactivity window.

Logout revokes the current session. Password changes and authenticator security changes invalidate earlier sessions. Security changes require fresh verification even when you are already signed in. An upgrade from the old session system requires a fresh login.

Serve PICR over HTTPS and keep `BASE_URL` set to its public URL, including any path prefix. Refresh cookies use the effective request scheme, including the forwarded scheme from a trusted reverse proxy; HTTPS requests receive Secure cookies. Alternate addresses can sign in when their Origin matches the effective request origin. Reverse proxies must overwrite client-supplied forwarding headers. Multiple tabs coordinate refresh operations to avoid racing token rotation.

## Local administrator recovery

If an administrator loses both their authenticator and recovery codes, an operator with server access can reset that account's 2FA. This is a local administrative operation, not a public endpoint.

For a running Docker container:

```sh
docker exec <picr-container> node server/backend/scripts/resetAdminMfa.js --username admin --confirm admin
```

Replace both `admin` values with the exact administrator username. For a source checkout:

```sh
npm --prefix backend run auth:reset -- --username admin --confirm admin
```

The command removes that account's authenticator and recovery codes, invalidates its sessions and pending login challenges, and logs the reset. It preserves the password and server-wide enforcement setting. If enforcement is enabled, the account must enroll again before accessing normal administrator functions.

If the configured key file is missing, fix the mount or unset both MFA key variables before running recovery. For Docker, command-specific overrides let the recovery process start without changing the running server configuration:

```sh
docker exec -e MFA_ENCRYPTION_KEY= -e MFA_ENCRYPTION_KEY_FILE= <picr-container> node server/backend/scripts/resetAdminMfa.js --username admin --confirm admin --disable-policy
```

`--disable-policy` explicitly turns off the server-wide requirement and is allowed only when recovering a root-scoped administrator. It does not disable 2FA on other enrolled accounts. Restore the original encryption key to recover those accounts, or reset them individually. For a source checkout, unset the variables in your environment and `.env` file first.

## First enrollment and rollback

Until an administrator has enrolled, knowledge of that account's password is sufficient to enroll an authenticator. Requiring 2FA does not establish a separate identity check for first enrollment. Have administrators enroll promptly and change any password suspected of compromise.

Downgrading to an older PICR version without 2FA restores that version's password-only sign-in behavior. Rollbacks are permitted, including when 2FA was enforced; account protection therefore follows the version you run. See [Backups and upgrades](../backups-and-upgrades/).

## Mobile compatibility

Existing mobile apps retain 28-day password-only sessions. Those sessions are still checked against account changes, revocation, and server-wide 2FA policy. Update the app to use renewable sessions and authenticator challenges. Accounts with 2FA enabled or required should use the web interface until the updated app is installed.
