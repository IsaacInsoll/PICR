local LrView = import "LrView"
local LrFunctionContext = import "LrFunctionContext"
local LrBinding = import "LrBinding"
local LrDialogs = import "LrDialogs"
local LrLogger = import 'LrLogger'

function PicrDialog(folder)
    return LrFunctionContext.callWithContext('PicrDialog', function(context)
        local f = LrView.osFactory()                            --obtain a view factory
        local properties = LrBinding.makePropertyTable(context) -- make a table
        local logo = _PLUGIN:resourceId("logo192.png")
        properties.payload = ""                                 -- initialize setting
        local contents = f:row {                                -- create UI elements
            spacing = f:label_spacing(),
            bind_to_object = properties,                        -- default bound table is the one we made
            f:picture {
                value = logo,
            },
            -- f:static_text {
            --     title = "PICR Payload",
            --     alignment = 'right',
            -- },
            f:edit_field {
                height_in_lines = 6,
                width_in_chars = 80,
                value = LrView.bind('payload'), -- edit field shows settings value
            },
        }
        local result = LrDialogs.presentModalDialog( -- invoke a dialog box
            {
                title = "Update " .. folder:getName() .. ' from PICR',
                contents = contents, -- with the UI elements
                actionVerb = "Go",   -- label for the action button
            }
        )
        if result == 'ok' then -- action button was clicked
            -- LrHttp.openUrlInBrowser(properties.url)
            return properties.payload
        end
        return nil
    end)
end
