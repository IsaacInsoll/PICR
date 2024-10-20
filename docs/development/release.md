# Building Release Version to Docker Hub

Run `npm run release` to use _release-it_ to increment version, tag release, build, push to docker hub and make a release on GitHub.

### Troubleshooting:
- If you haven't ever run `docker login` then you won't be able to push.
- Check for GITHUB_TOKEN in .ENV
- See [this link](https://dev.to/equiman/sharing-git-credentials-between-windows-and-wsl-5a2a) if `git push` doesn't work inside WSL
