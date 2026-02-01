# PICR Lightroom Plugin

Import ratings and approval flags from PICR into Lightroom Classic.

## Installation

### Option 1: Download from GitHub Releases (Recommended)

1. Go to the [Latest Lightroom Plugin Release](https://github.com/IsaacInsoll/PICR/releases/tag/lightroom-latest)
2. Download `picr-lightroom-v*.lrplugin.zip`
4. Extract the zip file
5. Copy the `picr.lrplugin` folder to your Lightroom plugins directory:
   - **macOS**: `~/Library/Application Support/Adobe/Lightroom/Modules/`
   - **Windows**: `C:\Users\<username>\AppData\Roaming\Adobe\Lightroom\Modules\`
6. Restart Lightroom

### Option 2: Add via Plugin Manager

1. Download the zip from [Releases](https://github.com/IsaacInsoll/PICR/releases) and extract it
2. In Lightroom, go to **File → Plug-in Manager**
3. Click **Add** and navigate to the extracted `picr.lrplugin` folder
4. Click **Done**

### Option 3: Clone the Repository

For developers or if you want the latest unreleased changes:

1. Clone the PICR repository
2. Copy `lightroom/picr.lrplugin` to your Lightroom plugins directory
3. Restart Lightroom

## Usage

1. In PICR, open a folder and click the menu → **Export filenames**
2. Select "PICR plugin CSV" format and optionally enable "Include subfolders"
3. Copy the CSV data to clipboard
4. In Lightroom, select the same folder in the Library module
5. Go to **Library → Plug-in Extras → Import PICR Data**
6. Paste the CSV data and click **Import**

## CSV Format

The plugin accepts CSV data in this format:

```
filename,rating,flag
photo1.jpg,5,approved
photo2.jpg,3,
subfolder/photo3.jpg,4,rejected
```

| Column | Values | Notes |
|--------|--------|-------|
| filename | path/name.ext | Relative path from selected folder |
| rating | 0-5 or empty | Empty = no change, 0 = unrated |
| flag | approved/rejected or empty | Empty = no change |

### Features

- **Ratings**: Sets Lightroom star rating (0-5)
- **Flags**: Maps PICR flags to Lightroom pick status:
  - `approved` → Picked (white flag)
  - `rejected` → Rejected (black X flag)
- **Subfolders**: Use relative paths like `day1/photo.jpg`
- **Extension matching**: `photo.jpg` in CSV matches `photo.NEF` in Lightroom
- **Virtual copies**: Supports PICR's virtual copy naming (e.g., `photo-2.jpg` for Copy 1)

## Version History

See [Releases](https://github.com/IsaacInsoll/PICR/releases?q=lightroom) for changelog.

## Development

See [AGENTS.md](./AGENTS.md) for development documentation.

## License

MIT - Part of the [PICR](https://github.com/IsaacInsoll/PICR) project.
