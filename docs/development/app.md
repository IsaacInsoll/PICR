# Picr App

### Server
The app connects to a server (either a 'real' server or development server)
For development I often just use a real server as most devices require HTTPS 
connection and that's a bit harder to do locally. 

> If you are wanting to contribute to the app and don't have a server to use, contact me and I'll give you credentials to a private server for testing. 

### New feature workflow
The general workflow is:
1. Do any changes required on the backend (IE: introducing new fields or functions)
2. Add support in frontend so that the web based version implements all the functionality it exposes
3. Add support in the app

Obviously if you are just adding stuff to the app that already exists in backend/frontend you don't need to follow these steps, or if it's general bugfix/beautification. 

## App Development CLI Commands

> Run from `app` folder. You can replace `ios` with `android` for all commands

| Command                       | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `npx expo start`              | Run Expo dev server                                           |
| `npx expo run:ios -d`         | build and run Development Build                               |
| `eas build` then `eas submit` | send to EAS for remote building then submission to app stores |

| Troubleshooting                               |                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npx expo export --platform ios`              | Build JS Bundle, used to troubleshoot bundle issues like bad imports                           |
| `npx expo start --no-dev --minify`            | run dev server but with 'production' code, for troubleshooting issues that don't hapeen in dev |
| `npx uri-scheme open picr://<some-url> --ios` | open deep link in simulator                                                                    |

### Local release build

Development builds require connection to a dev server. If you want a 'proper' build then:

`npx expo run:ios --configuration Release -d` or

`npx expo run:android --variant release -d`

These will have javascript 'baked in' and don't require dev server.

### Make a separate 'development' variant

If you want to have a release version and development version on the same device then you will need separate bundle IDs.
Run the following commands to make a separate 'dev' version of the app with a different bundle id.

```shell
APP_VARIANT=development npx expo prebuild --clean
APP_VARIANT=development npx expo run:ios -d
```
> Windows PowerShell ProTip: run `$env:APP_VARIANT = "development"` to set the env var for the current session

You will need to redo these steps if you install anything that requires new native packages
