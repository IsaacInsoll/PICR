# Building Release Version to Docker Hub

Run `npm run release` which will:

1. Do a full build (backend and frontend) then do tests
2. If successful, ask you for a new version number then push that to github
3. Release push will trigger github actions to build docker images and publish them

You can then manually edit the release on github if you want to add release notes.

### Troubleshooting:

- Check for `GITHUB_TOKEN` in .ENV
- See [this link](https://dev.to/equiman/sharing-git-credentials-between-windows-and-wsl-5a2a) if `git push` doesn't work inside WSL
