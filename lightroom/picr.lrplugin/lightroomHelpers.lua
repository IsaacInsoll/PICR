local LrApplication = import 'LrApplication'

function Active_folder()
  local catalog = LrApplication.activeCatalog()
  local sources = catalog:getActiveSources()

  for i, source in ipairs(sources) do
    if type(source) ~= 'string' then
      if source:type() == 'LrFolder' then
        return source;
      end
    end
  end
  return nil
end

function photoToShortFilename(pic)
  local filename = stripExtension(pic:getFormattedMetadata('fileName'))

  -- all done, except we have virtual copies :/
  local copyName = pic:getFormattedMetadata('copyName') -- typically blank
  if copyName ~= nil then
    local s = split(copyName, ' ')
    if #s == 2 then
      if s[1] == 'Copy' then
        filename = filename .. '-' .. tonumber(s[2]) + 1
      end
    end
  end
  return filename
end

function stripExtension(filename)
  return filename:sub(1, filename:find('.', 1, true) - 1) -- remove extension
end
