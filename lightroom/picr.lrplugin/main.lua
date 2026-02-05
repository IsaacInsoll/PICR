local LrApplication = import 'LrApplication'
local LrTasks = import 'LrTasks'
local LrDialogs = import 'LrDialogs'
local LrProgressScope = import 'LrProgressScope'

require 'lightroomHelpers'
require 'picrDialog'
require 'helpers'

local MAX_ERRORS_SHOWN = 10

LrTasks.startAsyncTask(function()
  local folder = Active_folder()
  if folder == nil then
    LrDialogs.message('PICR Import', 'Please select a folder in the Library module first.')
    return
  end

  -- Show scanning progress for large catalogs
  local scanProgress = LrProgressScope({
    title = 'PICR Import',
  })
  scanProgress:setCaption('Scanning folders...')
  scanProgress:setIndeterminate()

  -- Build a map of all photos including subfolders
  local photoMap, photoCount = buildPhotoMap(folder, scanProgress)
  scanProgress:done()

  -- Check if scan was cancelled
  if scanProgress:isCanceled() then
    return
  end

  -- Show dialog to get CSV data
  local folderPath = folder:getPath() or folder:getName()
  local payload = PicrDialog(folder, folderPath, photoCount)
  if payload == nil or payload == '' then
    return
  end

  local result = validateAndProcess(photoMap, payload)

  -- Build result message
  local title, message
  if result.errorCount > 0 then
    title = 'PICR Import Complete (with errors)'
    message = 'Updated ' .. result.updateCount .. ' file' .. (result.updateCount == 1 and '' or 's') .. '.\n'
    message = message .. result.errorCount .. ' error' .. (result.errorCount == 1 and '' or 's') .. ':\n\n'
    message = message .. result.errors
  elseif result.updateCount > 0 then
    title = 'PICR Import Complete'
    message = 'Successfully updated ' .. result.updateCount .. ' file' .. (result.updateCount == 1 and '' or 's') .. '.'
  elseif result.matchCount > 0 then
    title = 'PICR Import Complete'
    message = 'No changes needed - all ' .. result.matchCount .. ' file' .. (result.matchCount == 1 and ' is' or 's are') .. ' already up to date.'
  else
    title = 'PICR Import'
    message = 'No files from the CSV were found in this folder.\n\nMake sure you have the correct folder selected and the CSV paths match.'
  end

  LrDialogs.message(title, message)
end)

-- Build a map of relative path -> photo for matching
-- Supports subfolders by recursively traversing child folders
-- Returns photoMap and count of photos found
function buildPhotoMap(rootFolder, progress)
  local photoMap = {}
  local count = 0

  local function addPhotosFromFolder(folder, pathPrefix)
    -- Check for cancellation
    if progress and progress:isCanceled() then
      return
    end

    local photos = folder:getPhotos()
    for _, photo in ipairs(photos) do
      local filename = stripExtension(photo:getFormattedMetadata('fileName'))

      -- Handle virtual copies
      local copyName = photo:getFormattedMetadata('copyName')
      if copyName ~= nil and copyName ~= '' then
        local s = split(copyName, ' ')
        if #s == 2 and s[1] == 'Copy' then
          filename = filename .. '-' .. (tonumber(s[2]) + 1)
        end
      end

      local fullPath = pathPrefix .. filename
      photoMap[fullPath] = photo
      count = count + 1
    end

    -- Recursively process child folders
    local children = folder:getChildren()
    for _, childFolder in ipairs(children) do
      if progress and progress:isCanceled() then
        return
      end
      local childName = childFolder:getName()
      if progress then
        progress:setCaption('Scanning ' .. childName .. '...')
      end
      local newPrefix = pathPrefix .. childName .. '/'
      addPhotosFromFolder(childFolder, newPrefix)
    end
  end

  addPhotosFromFolder(rootFolder, '')
  return photoMap, count
end

-- Parse CSV and validate/process all entries
function validateAndProcess(photoMap, payload)
  local catalog = LrApplication.activeCatalog()
  local actions = {}
  local errors = {}
  local errorCount = 0
  local lineNum = 0
  local matchCount = 0

  -- First pass: parse and validate
  for line in string.gmatch(payload, "[^\r\n]+") do
    lineNum = lineNum + 1
    local lineError = nil

    local cols = split(line, ',')
    if #cols >= 1 then
      -- Trim the filename column
      local rawPath = trim(cols[1])

      -- Only process non-empty lines
      if rawPath ~= '' then
        local filePath = stripExtension(rawPath)
        local photo = photoMap[filePath]

        if photo == nil then
          lineError = "Line " .. lineNum .. ": file '" .. filePath .. "' not found"
        else
          matchCount = matchCount + 1
          local action = { photo = photo, fileName = filePath }

          -- Parse rating (column 2) - skip if empty
          local ratingStr = trim(cols[2] or '')
          if ratingStr ~= '' then
            local rating = tonumber(ratingStr)
            if rating == nil then
              lineError = "Line " .. lineNum .. ": invalid rating '" .. ratingStr .. "'"
            elseif rating < 0 or rating > 5 then
              lineError = "Line " .. lineNum .. ": rating must be 0-5, got " .. rating
            else
              action.rating = rating
            end
          end

          -- Parse flag (column 3) - skip if empty
          local flagStr = trim(cols[3] or ''):lower()
          if lineError == nil and flagStr ~= '' then
            if flagStr == 'approved' then
              action.pickStatus = 1
            elseif flagStr == 'rejected' then
              action.pickStatus = -1
            elseif flagStr == 'none' then
              action.pickStatus = 0
            else
              lineError = "Line " .. lineNum .. ": invalid flag '" .. flagStr .. "' (use approved/rejected)"
            end
          end

          if lineError == nil then
            table.insert(actions, action)
          end
        end

        if lineError ~= nil then
          errorCount = errorCount + 1
          if errorCount <= MAX_ERRORS_SHOWN then
            table.insert(errors, lineError)
          end
        end
      end
    end
  end

  -- Build error string with truncation
  local errorStr = table.concat(errors, '\n')
  if errorCount > MAX_ERRORS_SHOWN then
    errorStr = errorStr .. '\n...and ' .. (errorCount - MAX_ERRORS_SHOWN) .. ' more error' ..
               (errorCount - MAX_ERRORS_SHOWN == 1 and '' or 's')
  end

  -- Second pass: apply changes with progress bar
  local updateCount = 0

  if #actions > 0 then
    local progress = LrProgressScope({
      title = 'PICR Import',
    })

    catalog:withWriteAccessDo('PICR Update ' .. #actions .. ' Files', function(context)
      for i, action in ipairs(actions) do
        progress:setPortionComplete(i - 1, #actions)
        progress:setCaption('Updating ' .. action.fileName)

        local changed = false

        if action.rating ~= nil then
          local currentRating = action.photo:getRawMetadata('rating') or 0
          if currentRating ~= action.rating then
            action.photo:setRawMetadata('rating', action.rating)
            changed = true
          end
        end

        if action.pickStatus ~= nil then
          local currentPick = action.photo:getRawMetadata('pickStatus') or 0
          if currentPick ~= action.pickStatus then
            action.photo:setRawMetadata('pickStatus', action.pickStatus)
            changed = true
          end
        end

        if changed then
          updateCount = updateCount + 1
        end

        -- Allow cancellation
        if progress:isCanceled() then
          break
        end
      end
    end)

    progress:setPortionComplete(1, 1)
    progress:setCaption('Complete')
    progress:done()
  end

  return {
    updateCount = updateCount,
    matchCount = matchCount,
    errorCount = errorCount,
    errors = errorStr
  }
end
