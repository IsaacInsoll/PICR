# Lightroom Plugin Development Guide

Lightroom Classic plugin for syncing ratings and metadata with PICR. Written in Lua.

## Status: Prototype

This plugin is a **work-in-progress prototype**. Current functionality is limited to importing ratings from CSV text input. Server integration is not yet implemented.

### What Works

- Plugin installs and appears in Lightroom Library menu
- CSV parsing for `filename,rating` format
- File matching with virtual copy support
- Rating updates to Lightroom catalog
- Transaction-safe catalog writes

### What's Missing

- API integration with PICR server
- Automatic sync of ratings/flags
- Bi-directional sync
- User-friendly file browser
- Progress indication for large catalogs

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

  LrLibraryMenuItems = {
    {
      title = 'Import PICR Data',
      file = 'main.lua',
    },
  },

  VERSION = { major = 0, minor = 1, revision = 0 },
}
```

### main.lua - Core Logic

```lua
-- Entry point: runs when menu item clicked
LrTasks.startAsyncTask(function()
  -- 1. Get current folder
  local folder = Active_folder()

  -- 2. Show dialog, get CSV input
  local data = PicrDialog()
  if not data then return end  -- User cancelled

  -- 3. Validate data against folder contents
  local photos = folder:getPhotos()
  local errors = validateData(data, photos)
  if #errors > 0 then
    showErrors(errors)
    return
  end

  -- 4. Apply updates in transaction
  catalog:withWriteAccessDo('PICR Import', function()
    processData(data, photos)
  end)
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

## Current Data Format

The plugin currently accepts CSV text input:

```
filename,rating
photo1.jpg,5
photo2.jpg,3
wedding-001.jpg,4
```

### Virtual Copy Handling

Lightroom virtual copies have names like "Copy 1", "Copy 2". The plugin maps:
- `photo.jpg` → original
- `photo-2.jpg` → Copy 1 (note: -2 not -1)
- `photo-3.jpg` → Copy 2

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

### Common Gotchas

1. **Nil checks**: Lua doesn't error on nil access, so always check:
   ```lua
   if folder and folder:getName() then
     -- safe to use
   end
   ```

2. **String concatenation**: Use `..` operator, not `+`

3. **1-indexed arrays**: Lua arrays start at 1, not 0

4. **Local variables**: Always use `local` unless intentionally global

5. **Module imports**: Use Lightroom's `import` function:
   ```lua
   local LrApplication = import 'LrApplication'
   ```

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
