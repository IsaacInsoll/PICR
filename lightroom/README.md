# PICR Lightroom Plugin

Import ratings and approval flags from PICR into Lightroom Classic.

## Installation

### Download from PICR (Recommended)

The plugin is bundled with your PICR installation and always matches your version:

1. In PICR, go to any folder and click **CSV Export**
2. Select **PICR plugin CSV** format
3. Click the **PICR Lightroom Plugin** download link
4. Extract the zip file
5. Copy the `picr.lrplugin` folder to your Lightroom plugins directory:
   - **macOS**: `~/Library/Application Support/Adobe/Lightroom/Modules/`
   - **Windows**: `C:\Users\<username>\AppData\Roaming\Adobe\Lightroom\Modules\`
6. Restart Lightroom

### Alternative: Add via Plugin Manager

1. Download the plugin zip from PICR (as above) and extract it
2. In Lightroom, go to **File → Plug-in Manager**
3. Click **Add** and navigate to the extracted `picr.lrplugin` folder
4. Click **Done**

### For Developers

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

## Version

The plugin version matches the PICR version. When you update PICR, download the new plugin from the CSV Export dialog.

## Development

See [AGENTS.md](./AGENTS.md) for development documentation.

## License

MIT - Part of the [PICR](https://github.com/IsaacInsoll/PICR) project.
