# Global Error Policy

This document defines when PICR should show a full-screen global error overlay versus handling errors inline.

## Top-Level Rules

- Show global overlay for true network failures.
- Show global overlay for permission/scope failures that make the current action fundamentally unavailable.
- Do not show global overlay for auth logout paths (`NOT_LOGGED_IN`): handle by clearing auth/session state.
- Do not show global overlay for validation/input errors: show local inline feedback near the action.

## Source of Truth

- Auth reason and code registry: `shared/auth/authErrorContract.ts`
- URQL global classifier: `shared/urql/errorClassification.ts`

## Auth Reason Matrix

| Reason                    | GraphQL `extensions.code` | Global Action           | UX Behavior                                             |
| ------------------------- | ------------------------- | ----------------------- | ------------------------------------------------------- |
| `NOT_LOGGED_IN`           | `UNAUTHENTICATED`         | `logout`                | Clear auth/session and redirect/login flow. No overlay. |
| `ACCESS_DENIED`           | `FORBIDDEN`               | `global_no_permissions` | Show global "no permission" overlay.                    |
| `INVALID_LINK`            | `FORBIDDEN`               | `global_no_permissions` | Show global "no permission" overlay.                    |
| `NOT_A_USER`              | `FORBIDDEN`               | `global_no_permissions` | Show global "no permission" overlay.                    |
| `COMMENTS_NOT_ALLOWED`    | `FORBIDDEN`               | `global_no_permissions` | Show global "no permission" overlay (current behavior). |
| `COMMENTS_HIDDEN`         | `FORBIDDEN`               | `global_no_permissions` | Show global "no permission" overlay (current behavior). |
| `INVALID_HERO_IMAGE`      | `BAD_USER_INPUT`          | `local_only`            | Show local inline error only.                           |
| `INVALID_HERO_IMAGE_TYPE` | `BAD_USER_INPUT`          | `local_only`            | Show local inline error only.                           |
| `HERO_IMAGE_OUT_OF_SCOPE` | `BAD_USER_INPUT`          | `local_only`            | Show local inline error only.                           |

## Network Matrix

| Condition                           | Global Action         | UX Behavior                                                         |
| ----------------------------------- | --------------------- | ------------------------------------------------------------------- |
| Fetch/network transport unavailable | `network_unavailable` | Show global "network unavailable" overlay with retry/close actions. |

## Notes

- Fallback string markers remain for legacy responses, but new code should classify by `extensions.code` + `extensions.reason`.
- If this policy changes, update both the shared registry and classifier in the same PR.
