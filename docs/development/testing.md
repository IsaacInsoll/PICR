# Testing

## Current test procedure

> Pro Tip: Run all the build commands first before testing (EG: `npm run build`)

Currently the testing is only targeted at the **backend**. You can run a test by `npm run test` which:

- Builds docker image from existing `dist` folder
- Download example files (if not already downloaded) and extract into `/media` folder
- Start `test-picr` container on port `9001` and `test-db` image with temporary storage (so it's wiped every run)
- Run all tests in `/tests` folder (see below) targeting the `test-picr` container
- Stop docker containers

## Current Tests

Currently we don't have much test coverage so this is more a "you didn't completely break it" rather than "perfect in every way"
You can see all the tests in the `tests` folder. They must end in `.test.ts`

Obviously this is not exhaustive coverage so the short term plan is to cover all the GraphQL
endpoints on the backend, and if we have more developer time in future we may add front end testing.

## Troubleshooting 'ALL TESTS FAILING'

If every test fails then it's probably because the `test-picr` container isn't booting up okay. 
You can troubleshoot this with `cd tests && docker compose build && docker compose up`

This will build the container then start it, with all output going to the terminal (rather than hidden like when running tests)

Common faults include:

1. You didn't run all the pre-build steps like `./copy-files.sh`, `npm install`, `npm run build` etc
2. You wrote some code that works in 'existing' dev environment but breaks on a 'first run' (EG: expecting a DB field to be defined)


## Creating Tests
You can find tests in the `tests` folder and the files should be named starting with a 2 digit number as the existing tests are.
You are welcome to rename them to change the order if it makes sense to you
(EG: 'create shared folder' happens before 'can access shared folder'). 

## When are tests run?
- Tests are run before each release as part of the `release-it` configuration.
- Tests are no run before each commit.
- You can manually run a `npm run test` before commit to make sure it works*

\* I didn't want to force this on you as it's a bit of time "wasted" doing builds/tests if just commiting a small change. 

