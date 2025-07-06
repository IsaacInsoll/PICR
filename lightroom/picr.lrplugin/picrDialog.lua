local LrDialogs = import 'LrDialogs'
local LrView = import "LrView"
local LrFunctionContext = import "LrFunctionContext"
local LrBinding = import "LrBinding"
local LrLogger = import 'LrLogger'

function PicrDialog(folder)
    LrDialogs.message(folder:getName())
    LrFunctionContext.callWithContext('PicrDialog', function(context)
        local f = LrView.osFactory()                            --obtain a view factory
        local properties = LrBinding.makePropertyTable(context) -- make a table
        properties.url = "http://www.adobe.com"                 -- initialize setting
        local contents = f:row {                                -- create UI elements
            spacing = f:label_spacing(),
            bind_to_object = properties,                        -- default bound table is the one we made
            f:static_text {
                title = "URL",
                alignment = 'right',
            },
            f:edit_field {
                height_in_lines = 4,
                width_in_chars = 20,
                value = LrView.bind('url'), -- edit field shows settings value
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
            LrDialogs.message(properties.url)
        end
    end)
end
