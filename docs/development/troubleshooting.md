## Troubleshooting

### PICR exits at startup saying ffmpeg or ffprobe is missing

PICR now checks for both binaries during backend startup and fails fast if they are unavailable.

Fix:

1. Install `ffmpeg` for your development machine or server
2. Confirm both commands work:
   - `ffmpeg -version`
   - `ffprobe -version`
3. If they are installed in a non-standard location, set `FFMPEG_PATH` and/or `FFPROBE_PATH` in `.env`

On WSL2, install `ffmpeg` inside the Linux distro you use for development. Installing it only in Windows will not make it available to the backend running under WSL.

#### macOS Homebrew ffmpeg starts failing after installing/upgrading packages

If PICR reports that `ffmpeg` is unavailable, but the error includes
`dyld: Library not loaded` or `Library not loaded: /opt/homebrew/...`, Homebrew
has a broken dynamic link between `ffmpeg` and one of its dependencies. This can
happen after installing or upgrading nearby media packages.

Repair the Homebrew linkage:

```bash
brew update
brew reinstall x265 ffmpeg
ffmpeg -version
ffprobe -version
```

If either binary still fails, ask Homebrew what `ffmpeg` is missing and relink:

```bash
brew missing ffmpeg
brew link --overwrite x265
brew link --overwrite ffmpeg
ffmpeg -version
ffprobe -version
```

If `brew reinstall x265 ffmpeg` prints `Would reinstall` / `Would install` and
does not actually install anything, check that Homebrew is not running in
dry-run mode:

```bash
env | grep HOMEBREW
unset HOMEBREW_DRY_RUN
```

If Homebrew then reports a broken Cellar path such as
`/opt/homebrew/Cellar/ffmpeg/<version> is not a directory`, remove the broken
formula record and install again:

```bash
brew uninstall --force ffmpeg x265
brew cleanup ffmpeg x265
brew install x265 ffmpeg
ffmpeg -version
ffprobe -version
```

### RAW / PSD / HEIC files stay as generic files

RAW, PSD/PSB, and HEIC/HEIF previews depend on optional local binaries. PICR
will still boot if they are missing, but unsupported formats remain
`FileType.File` so originals can be downloaded without broken thumbnails.

1. Confirm ExifTool is available for RAW preview extraction:
   - `exiftool -ver`
2. Confirm ImageMagick is available for PSD/PSB/HEIC:
   - `magick -version`
   - `magick -list format`
3. In `magick -list format`, the relevant `PSD`, `PSB`, `HEIC`, or `HEIF` rows
   must include `r` in the Mode column. Presence without read mode is not
   enough.
4. If either binary is installed in a non-standard location, set
   `EXIFTOOL_PATH` or `MAGICK_PATH` in `.env`.

Install commands for common local development environments:

```bash
# macOS
brew install exiftool imagemagick

# Ubuntu / Debian
sudo apt update
sudo apt install libimage-exiftool-perl imagemagick

# Fedora
sudo dnf install perl-Image-ExifTool ImageMagick

# Arch Linux
sudo pacman -S perl-image-exiftool imagemagick

# Alpine Linux
sudo apk add exiftool imagemagick
```

```powershell
# Windows 11 with winget
winget install OliverBetz.ExifTool
winget install ImageMagick.ImageMagick

# Windows 11 with Chocolatey
choco install exiftool imagemagick
```

On WSL2, install the Linux packages inside WSL. Windows-native packages are only
used when the backend itself is running on Windows.

To see the exact ImageMagick rows PICR cares about:

```bash
magick -list format | grep -E '^\s*(PSD|PSB|HEIC|HEIF)\*?\s'
```

```powershell
magick -list format | Select-String '^\s*(PSD|PSB|HEIC|HEIF)\*?\s'
```

### PICR says database migrations failed when Docker has only just started

PICR now distinguishes between:

- the database being unavailable during startup
- an actual Drizzle migration failure

On boot, PICR will retry startup migrations once after 10 seconds if Postgres is not reachable yet. This helps when Docker has started the app container before Postgres is actually accepting connections.

If you are running PICR via Docker Compose, prefer a Postgres `healthcheck` plus `depends_on.condition: service_healthy` as well. That improves startup ordering, while PICR's own retry still protects against the remaining race conditions.

### Can't connect to postgres (DB) server

I've experienced this issue on multiple platforms where the app works fine but development tools / troubleshooting doesn't connect to DB.

Both times it was another postgres server running using the default port of `5432` so I just changed the `docker-compose.yaml` to expose `54321:5432`

- Synology has a 'generic' postgres server running for some of it's built in tools
- Davinci Resolve project server requires connecting to default port, so if you use that you can't expose 5432

Neither of these affect PICR operation, but will be a problem if trying to connect to the PICR DB (EG: troubleshooting or development)

### TypeScript error TS4111 on `styles.className`

If you see:

`Property '<name>' comes from an index signature, so it must be accessed with ['<name>']`

Then CSS module declaration files are likely out of date.

Fix:

1. Run `cd frontend && npm run css:types`
2. Re-run lint/typecheck

PICR prefers dot notation (`styles.className`) with typed CSS modules, so keep the generated `*.module.css.d.ts` files in sync.
