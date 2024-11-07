# Testing

## Current test procedure
Currently the testing is only targeted at the backend. You can run a test by `npm run test` which:
- Download example files (if not already downloaded) and extract into `/media` folder
- Build backend (not frontend), build docker image
- Start `test-picr` container on port `9001` and `test-db` image with temporary storage (so it's wiped every run)
- Run all tests in `/tests` folder (see below) targetting the `test-picr` container
- Stop docker containers

## Current Tests

Currently we don't have much test coverage so this is more a "you didn't completely break it" rather than "perfect in every way"
- Server is online (IE: nothing so bad that the express web server won't start)
- Admin user can log in with default user/pass and has correct permissions

Obviously this is not exhaustive coverage so the short term plan is to cover all the GraphQL
endpoints on the backend, and if we have more developer time in future we may add front end testing.


## Creating Tests
You can find tests in the `tests` folder and the files should be named starting with a 2 digit number as the existing tests are.
You are welcome to rename them to change the order if it makes sense to you
(EG: 'create shared folder' happens before 'can access shared folder')

## When are tests run?
- Tests are run before each release as part of the `release-it` configuration.
- Tests are no run before each commit.
- You can manually run a `npm run test` before commit to make sure it works*

\* I didn't want to force this on you as it's a bit of time "wasted" doing builds/tests if just commiting a small change. 

