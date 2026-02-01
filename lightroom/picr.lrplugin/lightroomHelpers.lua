local LrApplication = import 'LrApplication'

-- Get the currently selected folder in Lightroom
function Active_folder()
  local catalog = LrApplication.activeCatalog()
  local sources = catalog:getActiveSources()

  for i, source in ipairs(sources) do
    if type(source) ~= 'string' then
      if source:type() == 'LrFolder' then
        return source
      end
    end
  end
  return nil
end

-- Remove file extension from a path (handles subfolder paths)
-- e.g., "subfolder/photo.jpg" -> "subfolder/photo"
function stripExtension(path)
  if path == nil or path == '' then
    return ''
  end
  local lastDot = path:find('%.[^./]+$')
  if lastDot then
    return path:sub(1, lastDot - 1)
  end
  return path
end
