local LrApplication = import 'LrApplication'
local LrTasks = import 'LrTasks'
local LrDialogs = import 'LrDialogs'
local LrLogger = import 'LrLogger'

local logger = LrLogger('PICR')
require 'lightroomHelpers'
require 'picrDialog'
require 'helpers'

logger:enable("print") -- log to debug output

LrTasks.startAsyncTask(function()
  local folder = Active_folder(sources);
  if folder == nil then
    LrDialogs.message('Sorry, you must have a Folder selected')
    return
  end
  local payload = PicrDialog(folder);
  if payload == nil or payload == '' then
    return
  end
  local photos = folder:getPhotos()
  validateData(photos, payload)
end)

function validateData(photos, payload)
  local fileNames = map(photos, photoToShortFilename)
  local i = 1
  local errors = ''
  local actions = {}
  for line in string.gmatch(payload, "[^\r\n]+") do
    local lineError = nil;
    local cols = split(line, ',')
    local fileName = stripExtension(cols[1])
    local matches = #filter(fileNames, function(f) return f == fileName end);

    if matches == 0 then
      lineError = "Line " .. i .. ": file `" .. fileName .. "` not found"
    elseif matches > 1 then
      lineError = "Line " .. i .. ": file `" .. fileName .. "` matches more than 1 file (virtual copies?)"
    end

    local rating = tonumber(cols[2])
    if rating == nil and lineError == nil then
      lineError = "Line " .. i .. ": unknown rating"
    end

    if lineError ~= nil then
      errors = errors .. "\n" .. lineError
    else
      table.insert(actions, { fileName = fileName, rating = rating })
    end
    i = i + 1
  end

  if errors ~= '' then
    LrDialogs.message("No changes made as errors were found: \n\n" .. errors);
    return
  end
  processData(photos, actions)
end

function processData(photos, actions)
  local catalog = LrApplication.activeCatalog()
  catalog:withWriteAccessDo('PICR Update' .. #actions .. ' Files', function(context)
    for k, action in pairs(actions) do
      local fileName = action['fileName']
      local matchingFiles = filter(photos, function(pic) return photoToShortFilename(pic) == fileName end)
      if (#matchingFiles == 1) then
        for k2, f in pairs(matchingFiles) do
          -- todo: check if metadata has changed so we can count how many changes from the current run (EG: 0 files updated)
          f:setRawMetadata('rating', action["rating"])
        end
      end
    end
  end)
end
