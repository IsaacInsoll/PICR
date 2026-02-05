local LrView = import "LrView"
local LrFunctionContext = import "LrFunctionContext"
local LrBinding = import "LrBinding"
local LrDialogs = import "LrDialogs"

function PicrDialog(folder, folderPath, photoCount)
  return LrFunctionContext.callWithContext('PicrDialog', function(context)
    local f = LrView.osFactory()
    local properties = LrBinding.makePropertyTable(context)
    local logo = _PLUGIN:resourceId("logo192.png")
    properties.payload = ""

    -- Truncate path if too long
    local displayPath = folderPath
    if #displayPath > 60 then
      displayPath = '...' .. displayPath:sub(-57)
    end

    local photoCountText = photoCount .. ' photo' .. (photoCount == 1 and '' or 's') .. ' found'

    local contents = f:column {
      spacing = f:control_spacing(),
      bind_to_object = properties,

      f:row {
        spacing = f:label_spacing(),
        f:picture {
          value = logo,
          width = 64,
          height = 64,
        },
        f:column {
          spacing = f:label_spacing(),
          f:static_text {
            title = "Import ratings and flags from PICR",
            font = "<system/bold>",
          },
          f:static_text {
            title = displayPath,
            font = "<system/small>",
          },
          f:static_text {
            title = photoCountText,
            font = "<system/small>",
          },
        },
      },

      f:spacer { height = 10 },

      f:static_text {
        title = "Paste CSV data below (filename, rating, flag)",
      },
      f:static_text {
        title = "Format: filename,rating,flag  |  rating: 0-5  |  flag: approved/rejected",
        font = "<system/small>",
      },
      f:static_text {
        title = "Subfolders: use relative paths (e.g., subfolder/photo.jpg)",
        font = "<system/small>",
      },

      f:spacer { height = 5 },

      f:edit_field {
        height_in_lines = 12,
        width_in_chars = 70,
        value = LrView.bind('payload'),
      },
    }

    local result = LrDialogs.presentModalDialog({
      title = "Import to '" .. folder:getName() .. "' from PICR",
      contents = contents,
      actionVerb = "Import",
    })

    if result == 'ok' then
      return properties.payload
    end
    return nil
  end)
end
