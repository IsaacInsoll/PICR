# PICR Lightroom Plugin

Import ratings, pick flags, and subfolder matches from PICR into Lightroom Classic.

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
photo1.jpg,5,approved
photo2.jpg,3,
subfolder/photo3.jpg,4,rejected
photo4.jpg,0,none
```

| Column | Values | Notes |
|--------|--------|-------|
| filename | path/name.ext | Relative path from selected folder |
| rating | 0-5 or empty | Empty = no change, 0 = unrated |
| flag | approved/rejected/none or empty | Empty = no change, `none` clears the pick flag |

Important: paste the CSV data rows only. The current plugin parser does not ignore a header row.

### Features

- **Ratings**: Sets Lightroom star rating (0-5)
- **Zero stars**: `0` clears the Lightroom star rating
- **Flags**: Maps PICR flags to Lightroom pick status:
  - `approved` → Picked (white flag)
  - `rejected` → Rejected (black X flag)
  - `none` → Clears pick/reject status
- **Subfolders**: Use relative paths like `day1/photo.jpg`
- **Extension matching**: `photo.jpg` in CSV matches `photo.NEF` in Lightroom
- **Virtual copies**: Supports PICR's virtual copy naming (e.g., `photo-2.jpg` for Copy 1)
- **Progress UI**: Shows scan progress, per-file import progress, and a completion summary

### Current Limitations

- A header row like `filename,rating,flag` will be treated as data and produce an error
- Extension-agnostic matching can be ambiguous if multiple files in the same relative path share the same basename with different extensions
- Matching depends on selecting the correct Lightroom folder root before import

## Version

The plugin version matches the PICR version. When you update PICR, download the new plugin from the CSV Export dialog.

## Development

See [AGENTS.md](./AGENTS.md) for development documentation.

## License

MIT - Part of the [PICR](https://github.com/IsaacInsoll/PICR) project.
