# Lightroom Plugin Development Guide

Lightroom Classic plugin for syncing ratings and metadata with PICR. Written in Lua.

## Status: Alpha

This plugin imports ratings and flags from PICR's CSV export into Lightroom Classic.

### What Works

- Plugin installs and appears in Lightroom Library menu
- CSV parsing for `filename,rating,flag` format (PICR export format)
- Rating updates (0-5 stars)
- Flag/pick status updates (approved → picked, rejected → rejected)
- Subfolder support with relative paths (e.g., `subfolder/photo.jpg`)
- File matching with virtual copy support
- Extension-agnostic matching (CSV `photo.jpg` matches Lightroom `photo.NEF`)
- Progress indicators:
  - "Scanning folders..." with cancellation during catalog scan
  - Progress bar with current file during import
- Empty values in CSV are skipped (no change to current value)
- Transaction-safe catalog writes
- Smart completion messages:
  - Shows update count with proper pluralization
  - Distinguishes "already up to date" from "no files matched"
  - Truncates error list to 10 items with "...and N more" summary
- Dialog shows folder path and photo count for verification

### What's Missing

- API integration with PICR server (direct sync without CSV)
- Automatic sync of ratings/flags
- Bi-directional sync (Lightroom → PICR)
- Settings UI for server configuration

## Releasing

The Lightroom plugin version is automatically synced with the main PICR version. There is no separate release process.

### How It Works

1. When `npm run release` is run from the root PICR folder, the release-it hook updates `Info.lua` to match the PICR version
2. During CI build, the plugin is zipped and placed in `dist/public/picr-lightroom-plugin.zip`
3. Users download the plugin directly from their PICR instance via the CSV Export dialog

### Version Sync

The plugin version in `picr.lrplugin/Info.lua` always matches the PICR version. This ensures users always have a compatible plugin for their PICR installation.

### Manual Version Update

If needed, update the version manually:
```bash
node lightroom/scripts/update-info-lua.js 1.2.3
```

## Lightroom SDK Documentation

### Important: API Docs Location

The Lightroom SDK documentation is stored in `lightroom/docs/` but is **gitignored** (Adobe licensing restrictions).

**If the `docs/` folder is empty or missing:**
1. Download the Lightroom SDK from Adobe's developer site
2. Extract the HTML documentation
3. Copy contents of `API Reference` to `lightroom/docs/`
4. The documentation is critical for plugin development

**If the `docs/` folder exists:**
Use these docs **exclusively** when developing the plugin. Key references:

| File | Purpose |
|------|---------|
| `docs/index.html` | Main documentation entry point |
| `docs/modules/LrApplication.html` | Application and catalog access |
| `docs/modules/LrCatalog.html` | Catalog operations |
| `docs/modules/LrPhoto.html` | Photo metadata access |
| `docs/modules/LrFolder.html` | Folder operations |
| `docs/modules/LrDialogs.html` | UI dialogs |
| `docs/modules/LrView.html` | UI view building |
| `docs/modules/LrBinding.html` | Data binding |
| `docs/modules/LrTasks.html` | Async task handling |
| `docs/modules/LrHttp.html` | HTTP requests (for API integration) |

### Checking for Docs

```lua
-- At development time, verify docs exist:
-- ls lightroom/docs/modules/
-- Should show .html files for each Lr* module
```

## Directory Structure

```
lightroom/
├── docs/                     # SDK documentation (gitignored)
│   └── modules/              # API reference HTML files
└── picr.lrplugin/           # The actual plugin
    ├── Info.lua             # Plugin metadata
    ├── main.lua             # Main logic (data processing)
    ├── picrDialog.lua       # UI dialog
    ├── lightroomHelpers.lua # Lightroom API helpers
    ├── helpers.lua          # Generic Lua utilities
    └── logo192.png          # Plugin icon
```

## Plugin Architecture

### Info.lua - Plugin Metadata

```lua
return {
  LrSdkVersion = 10.0,
  LrPluginName = 'PICR Lightroom Plugin',
  LrToolkitIdentifier = 'com.isaacinsoll.picr.lr-plugin',
  LrPluginInfoUrl = 'https://github.com/IsaacInsoll/PICR/tree/master/lightroom',

  LrLibraryMenuItems = {
    {
      title = 'Import PICR Data',
      file = 'main.lua',
    },
  },

  VERSION = { major = 0, minor = 2, revision = 0 },
}
```

### main.lua - Core Logic

```lua
-- Entry point: runs when menu item clicked
LrTasks.startAsyncTask(function()
  -- 1. Get current folder
  local folder = Active_folder()
  if not folder then return end

  -- 2. Scan folder tree with progress indicator
  local scanProgress = LrProgressScope({ title = 'PICR Import' })
  scanProgress:setCaption('Scanning folders...')
  local photoMap, photoCount = buildPhotoMap(folder, scanProgress)
  scanProgress:done()

  -- 3. Show dialog, get CSV input
  local data = PicrDialog(folder, folderPath, photoCount)
  if not data then return end  -- User cancelled

  -- 4. Validate and process with progress bar
  local result = validateAndProcess(photoMap, data)

  -- 5. Show appropriate result message
  LrDialogs.message(title, message)
end)
```

## Lua Patterns for Lightroom

### Async Tasks

All operations that take time must be wrapped in async tasks:

```lua
local LrTasks = import 'LrTasks'

LrTasks.startAsyncTask(function()
  -- Your async code here
  -- UI operations, file I/O, etc.
end)
```

### Catalog Write Access

All metadata modifications require write access:

```lua
local catalog = LrApplication.activeCatalog()

catalog:withWriteAccessDo('Action Name', function()
  -- Modify photos here
  photo:setRawMetadata('rating', 5)
end)
```

### Getting Selected Folder

```lua
local LrApplication = import 'LrApplication'

function Active_folder()
  local catalog = LrApplication.activeCatalog()
  local sources = catalog:getActiveSources()

  for _, source in ipairs(sources) do
    if source:type() == 'LrFolder' then
      return source
    end
  end
  return nil
end
```

### Photo Metadata

```lua
-- Reading metadata
local filename = photo:getFormattedMetadata('fileName')
local rating = photo:getRawMetadata('rating')
local copyName = photo:getFormattedMetadata('copyName')  -- For virtual copies

-- Writing metadata (inside withWriteAccessDo)
photo:setRawMetadata('rating', 5)  -- 0-5 stars
```

### Building UI

```lua
local LrView = import 'LrView'
local LrDialogs = import 'LrDialogs'
local LrBinding = import 'LrBinding'

LrFunctionContext.callWithContext('MyDialog', function(context)
  local props = LrBinding.makePropertyTable(context)
  props.inputText = ''

  local f = LrView.osFactory()
  local contents = f:column {
    f:row {
      f:static_text { title = 'Enter data:' },
    },
    f:edit_field {
      value = LrView.bind('inputText'),
      width_in_chars = 40,
      height_in_lines = 6,
    },
  }

  local result = LrDialogs.presentModalDialog({
    title = 'My Dialog',
    contents = contents,
    actionVerb = 'Submit',
  })

  if result == 'ok' then
    return props.inputText
  end
  return nil
end)
```

## CSV Data Format

The plugin accepts CSV text exported from PICR:

```
filename,rating,flag
photo1.jpg,5,approved
photo2.jpg,3,
subfolder/photo3.jpg,4,rejected
photo4.jpg,,approved
```

### Column Definitions

| Column | Values | Notes |
|--------|--------|-------|
| filename | path/name.ext | Relative path from selected folder. Extension is ignored for matching. |
| rating | 0-5 or empty | Empty = no change. 0 = unrated. |
| flag | approved/rejected or empty | Empty = no change. Maps to Lightroom's pick status. |

### Flag Mapping

| PICR Flag | Lightroom Pick Status |
|-----------|----------------------|
| approved | Picked (flag) |
| rejected | Rejected (X) |
| (empty) | No change |

### Subfolder Support

When exporting from PICR with "Include subfolders" enabled, paths are relative:
- `photo.jpg` → in selected folder
- `day1/photo.jpg` → in subfolder "day1"
- `day1/ceremony/photo.jpg` → in nested subfolder

### Virtual Copy Handling

Lightroom virtual copies have names like "Copy 1", "Copy 2". The plugin maps:
- `photo.jpg` → original
- `photo-2.jpg` → Copy 1 (note: -2 not -1)
- `photo-3.jpg` → Copy 2

### Extension Matching

The plugin strips extensions before matching, so:
- CSV `photo.jpg` matches Lightroom `photo.NEF` or `photo.CR2`
- This supports workflows where JPG exports are rated in PICR but RAW files are in Lightroom

## Future: PICR Server Integration

When implementing server sync, use `LrHttp` for API calls:

```lua
local LrHttp = import 'LrHttp'

-- GET request
local response, headers = LrHttp.get('https://picr.example.com/api/endpoint')

-- POST with JSON
local response, headers = LrHttp.post(
  'https://picr.example.com/graphql',
  '{"query": "..."}',
  {
    { field = 'Content-Type', value = 'application/json' },
    { field = 'Authorization', value = 'Bearer ' .. token },
  }
)
```

### Planned Sync Flow

1. User configures server URL and credentials
2. Plugin fetches folder/file list from PICR
3. Matches local Lightroom files to server files
4. Bi-directional sync of:
   - Ratings (0-5 stars)
   - Flags (approved/rejected)
   - Comments (read-only in Lightroom?)
5. Conflict resolution UI

## Development Tips

### Testing Changes

1. Edit Lua files
2. In Lightroom: File → Plug-in Manager → Reload Plug-in
3. Run the plugin from Library menu
4. Check Console.app (macOS) or Event Viewer (Windows) for logs

### Debugging

```lua
local LrLogger = import 'LrLogger'
local logger = LrLogger('PICR')
logger:enable('print')  -- Output to debug console

logger:info('Processing file: ' .. filename)
logger:warn('Warning message')
logger:error('Error message')
```

## CRITICAL: Lua 5.1 Limitations

**Lightroom uses Lua 5.1**, not modern Lua 5.2+. Many online Lua tutorials and examples use newer syntax that will cause runtime errors in Lightroom.

### Features NOT Available (Lua 5.2+ only)

| Feature | Error You'll See | Workaround |
|---------|------------------|------------|
| `goto` and `::label::` | `'=' expected near 'continue'` | Use nested `if`/`else` or extract to function |
| `table.unpack()` | `attempt to call nil` | Use `unpack()` (global in 5.1) |
| `table.pack()` | `attempt to call nil` | Use `{...}` and manually set `n` |
| Bitwise operators (`&`, `\|`, `~`) | syntax error | Use `bit` library if available |
| `_ENV` | undefined | Use `setfenv`/`getfenv` (5.1 style) |
| `\z` string escape | invalid escape | Remove or use explicit handling |
| `\x` hex escapes | invalid escape | Use `\ddd` decimal escapes |
| Empty statements `;;` | syntax error | Remove extra semicolons |
| `rawlen()` | `attempt to call nil` | Use `#` operator |

### Example: Avoiding goto

```lua
-- DON'T: Lua 5.2+ syntax
for line in lines do
  if shouldSkip then
    goto continue
  end
  process(line)
  ::continue::
end

-- DO: Lua 5.1 compatible
for line in lines do
  if not shouldSkip then
    process(line)
  end
end
```

## Lightroom-Specific Oddities

### Sandboxed Environment

Lightroom runs plugins in a sandboxed Lua environment with restrictions:

| Standard Lua | Lightroom Alternative |
|--------------|----------------------|
| `io` library | `LrFileUtils`, `LrPathUtils` |
| `os.execute` | Not available (security) |
| `os.date/time` | `LrDate` |
| `require` | `import` for Lr modules, `require` for plugin files |
| `print` | `LrLogger` (output to system console) |
| `dofile` | Not available |

### Global Function Scope

Functions defined without `local` are **global across all plugin files**:

```lua
-- In helpers.lua
function split(str, sep)  -- This is GLOBAL
  ...
end

-- In main.lua
require 'helpers'
local result = split("a,b,c", ",")  -- Works because split is global
```

This is intentional for this plugin, but be aware it can cause naming conflicts.

### String Handling

- All strings must be UTF-8 encoded
- Use `..` for concatenation (not `+`)
- Lightroom metadata can return `nil` - always handle it:
  ```lua
  local name = photo:getFormattedMetadata('fileName') or 'unknown'
  ```

### Async Requirements

Many operations MUST be called from within `LrTasks.startAsyncTask`:
- Any UI dialogs (`LrDialogs`)
- Catalog operations
- Progress scopes
- HTTP requests

```lua
-- This will fail or behave unexpectedly:
LrDialogs.message("Hello")  -- Called outside async task

-- Do this instead:
LrTasks.startAsyncTask(function()
  LrDialogs.message("Hello")
end)
```

### Catalog Write Transactions

- Only ONE `withWriteAccessDo` can be active at a time
- Keep transactions as short as possible
- Reading metadata doesn't require write access (as of SDK 3.0)

### Common Gotchas

1. **Nil checks**: Lua doesn't error on nil table access, so always check:
   ```lua
   if folder and folder:getName() then
     -- safe to use
   end
   ```

2. **String concatenation**: Use `..` operator, not `+`

3. **1-indexed arrays**: Lua arrays start at 1, not 0

4. **Local variables**: Always use `local` unless intentionally global

5. **Module imports**: Use Lightroom's `import` function for SDK modules:
   ```lua
   local LrApplication = import 'LrApplication'
   ```

6. **Boolean coercion**: Only `nil` and `false` are falsy. `0` and `""` are truthy!
   ```lua
   if 0 then print("This WILL print!") end
   if "" then print("This WILL print too!") end
   ```

7. **Table length**: `#` operator only works reliably on arrays with no gaps

8. **No continue statement**: Use nested `if` or refactor to early `return` in a function

## Troubleshooting

### Plugin not appearing in menu

1. Check `Info.lua` syntax
2. Check `LrLibraryMenuItems` is correctly formatted
3. Reload plugin in Plug-in Manager

### Catalog write errors

1. Ensure code is inside `withWriteAccessDo`
2. Check no other write operation is active
3. Try restarting Lightroom

### File not found errors

1. Check filename matching logic
2. Check virtual copy handling
3. Log filenames to debug:
   ```lua
   logger:info('Looking for: ' .. targetFilename)
   for _, photo in ipairs(photos) do
     logger:info('Found: ' .. photo:getFormattedMetadata('fileName'))
   end
   ```
