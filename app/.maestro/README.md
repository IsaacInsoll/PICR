# Local Maestro smoke test

This flow exercises the photographer path without an EAS build:

`login → dashboard → home folder → first media item → back`

The authenticated user's home folder must contain at least one supported image
or video. The flow clears the development app's local state before it runs.

Build and start the local development variant from `app/`:

```bash
APP_VARIANT=development npx expo prebuild --clean --platform android
APP_VARIANT=development npx expo run:android --device
npx expo start --dev-client
```

With the Maestro CLI installed and the emulator/device connected, provide test
credentials as environment variables and run:

```bash
MAESTRO_APP_ID=com.isaacinsoll.picr.dev \
MAESTRO_SERVER=https://picr.example.com/ \
MAESTRO_USERNAME=admin \
MAESTRO_PASSWORD='replace-me' \
npm run test:maestro:smoke
```

Do not commit real credentials. `MAESTRO_APP_ID` can be changed to
`com.isaacinsoll.picr` when deliberately testing the non-development package.
