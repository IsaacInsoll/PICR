# PICR App

## Server

The app connects to either a production PICR server or a local development
server. A production server is often more convenient for testing on physical
devices because it already provides HTTPS.

> If you want to contribute to the app and do not have a server, contact the
> maintainer for credentials to a private test server.

### New feature workflow

The general workflow is:

1. Do any changes required on the backend (IE: introducing new fields or functions)
2. Add support in frontend so that the web based version implements all the functionality it exposes
3. Add support in the app

App-only fixes and app support for existing backend/frontend behavior do not
require all three steps.

### Photographer-only routing

The native app supports authenticated photographer/admin routes. Client gallery
routes such as `/s/:uuid/:folderId/:fileId?` belong to the web frontend and open
in the browser when received through an old app link or notification. Incoming
notification URLs are allowlisted: `/admin/...` targets may navigate inside the
app, `/s/...` targets open in the browser, and unrelated URLs are ignored.

### Login failure handling

The existing backend returns an empty auth token for both rejected credentials
and temporary rate-limit blocks. The app preserves that API contract, converts
the response to a typed local `authentication_rejected` result and uses URQL's
transport metadata for unreachable servers. `LoginForm` does not inspect error
message text to recover control-flow state. Introducing machine-readable server
login errors is separate core PICR API work.

## Local-first development

PICR uses Expo's free plan, so routine development must not consume EAS cloud
builds. Run lint, typecheck, tests, Expo Doctor and both Expo exports locally
before requesting a remote build. Use local development builds for native and
Maestro/manual testing wherever the host platform permits it.

An EAS build is reserved for a change that genuinely needs Expo's remote native
environment or for a batched release candidate. Production releases are limited
to no more than one coordinated iOS/Android release per calendar week.

## App Development CLI Commands

Run these commands from `app/`. Replace `ios` with `android` where applicable.

| Command                              | Description                                       |
| ------------------------------------ | ------------------------------------------------- |
| `npx expo start`                     | Start Metro for an installed development build    |
| `npx expo run:ios -d`                | Build and run locally on an iOS simulator/device  |
| `npx expo run:android --device`      | Build and run locally on an Android device        |
| `npx expo-doctor`                    | Validate Expo packages and project configuration  |
| `npx expo export --platform ios`     | Validate the production iOS JavaScript bundle     |
| `npx expo export --platform android` | Validate the production Android JavaScript bundle |

| Troubleshooting                               | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `npx expo start --no-dev --minify`            | Reproduce production-only JavaScript behavior        |
| `npx expo start --clear`                      | Clear Metro's cache after dependency/resolution work |
| `npx uri-scheme open picr://<some-url> --ios` | Open a deep link in the iOS simulator                |

### Local release build

Development builds require Metro. To compile a standalone local release build
with JavaScript bundled into the app, use:

`npx expo run:ios --configuration Release -d` or

`npx expo run:android --variant release -d`

These will have javascript 'baked in' and don't require dev server.

### Make a separate 'development' variant

The development variant has a separate app name, URL scheme and bundle/package
identifier, so it can coexist with the store version. Native directories are
generated and ignored; regenerate them for this variant with:

```shell
APP_VARIANT=development npx expo prebuild --clean
APP_VARIANT=development npx expo run:ios -d
```

> Windows PowerShell ProTip: run `$env:APP_VARIANT = "development"` to set the env var for the current session

Repeat the clean prebuild after changing native packages or app configuration.
Do not use an old development client as upgrade validation.

The `run:android` and `run:ios` commands only generate a native directory when
it is missing. After an Expo SDK or native dependency update, explicitly refresh
the relevant ignored project before building:

```shell
npx expo prebuild --clean --platform android
npx expo run:android --device
```

On macOS, use `--platform ios` followed by `npx expo run:ios -d`. Do not repair
generated `MainApplication.kt` or `AppDelegate` files manually; put intentional
native changes in `app.config.ts` or a config plugin.

Hermes does not provide the complete Intl dependency chain needed by
`RelativeTimeFormat`, so the app entrypoint force-installs
`getCanonicalLocales`, `Locale`, `PluralRules`, and `RelativeTimeFormat` in
dependency order. It bundles only the supported Greek, English and French
plural/relative-time locale data. Add both matching static locale-data imports
in `app/src/polyfills.ts` and the locale assertion in
`app/scripts/check-polyfills.mjs` whenever another app language is introduced.
Run `cd app && npm run check:polyfills`, then restart Metro with
`npx expo start --clear` before runtime smoke testing.

## App tests

Run the Jest unit/component suite locally with:

```shell
cd app
npm test
```

The suite uses the Expo SDK 55 `jest-expo` preset and React Native Testing
Library. It is also part of the root `npm run check`, app release preflight and
CI build.

The critical native photographer flow is scaffolded in
`app/.maestro/`. It uses the local development variant, so it does not consume
an EAS build. Follow `app/.maestro/README.md` to build the variant and pass
server credentials via `MAESTRO_*` environment variables. The fast smoke flow
covers login and image navigation; the complete suite additionally covers image
download, video playback, comment creation and notification settings. Use a
dedicated test account with at least one image and video because the complete
suite has documented device/server side effects. Run Maestro through the npm
scripts while Metro remains active; their wrapper retrieves and opens Expo's
development-client URL after each clean-state launch. Set `MAESTRO_EXPO_PORT`
when Metro selected a port other than 8081.
