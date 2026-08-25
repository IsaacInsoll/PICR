# Local Maestro tests

The Maestro workspace exercises the photographer app without an EAS build.
Every root flow clears app state, logs in through `subflows/login.yaml`, and can
run independently.

## Test data and side effects

Use a dedicated test account whose home folder contains at least one supported
image and one supported video. The flows deliberately exercise real behavior:

- `image-download.yaml` saves the first image to the emulator/device library.
- `video-playback.yaml` waits for the first video to begin playing.
- `comment-creation.yaml` adds a real comment to the first image. Override its
  default text with `MAESTRO_COMMENT` when useful.
- `notification-settings.yaml` toggles the server preference once when a push
  token is available. Expo does not provide push tokens on an emulator, so that
  flow instead verifies the explicit unavailable state there.
- `photographer-smoke.yaml` is the fast, non-mutating navigation check.

Do not point the mutating flows at media or an account where those side effects
would be unwelcome.

## Run locally

Install the [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro),
then build and start the local development variant from `app/`. Leave the Expo
process running while Maestro executes in another terminal:

```bash
APP_VARIANT=development npx expo prebuild --clean --platform android
APP_VARIANT=development npx expo run:android --device
```

Every flow clears native app state, which also clears the development client's
remembered Metro project. The npm test wrapper asks the active Expo server for
its development-client launch URL and has Maestro reopen PICR automatically; the
Expo launcher is not part of the test flow and requires no manual interaction.

Expo uses port 8081 by default. If its terminal reports another port, pass that
port when running Maestro, for example `MAESTRO_EXPO_PORT=8082`. You can instead
provide the full development-client URI shown by Expo as
`MAESTRO_DEV_CLIENT_URL`.

Provide test credentials through `MAESTRO_*` shell variables. Maestro CLI
automatically exposes variables with that prefix to flows:

```bash
MAESTRO_SERVER=https://picr.example.com/ \
MAESTRO_USERNAME=admin \
MAESTRO_PASSWORD='replace-me' \
npm run test:maestro:smoke
```

For example, when Metro selected port 8082:

```bash
MAESTRO_EXPO_PORT=8082 \
MAESTRO_SERVER=https://picr.example.com/ \
MAESTRO_USERNAME=admin \
MAESTRO_PASSWORD='replace-me' \
npm run test:maestro:smoke
```

Run the complete local suite with the same variables:

```bash
MAESTRO_SERVER=https://picr.example.com/ \
MAESTRO_USERNAME=admin \
MAESTRO_PASSWORD='replace-me' \
MAESTRO_COMMENT='Maestro smoke comment' \
npm run test:maestro
```

The development app ID defaults to `com.isaacinsoll.picr.dev`. Set
`MAESTRO_APP_ID=com.isaacinsoll.picr` only when deliberately testing the
non-development package. Every root flow uses `clearState: true`, so doing this
logs out and clears local data for that installed app.

If Maestro reports that the default package is not installed, inspect the
emulator/device before rebuilding:

```bash
adb shell pm list packages | grep com.isaacinsoll.picr
```

An installed `com.isaacinsoll.picr` package is the normal variant. Either rerun
with `MAESTRO_APP_ID=com.isaacinsoll.picr`, accepting the state reset above, or
install the development variant using the `APP_VARIANT=development` commands in
this guide. When using the normal package, start Metro without `APP_VARIANT` so
Expo returns its matching `picr://` development-client URL. Neither option
requires an EAS build. Never commit real credentials.
