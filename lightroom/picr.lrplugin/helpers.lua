-- Split string by separator, preserving empty fields
-- e.g., "a,,c" with sep="," returns {"a", "", "c"}
function split(str, sep)
  local fields = {}
  local start = 1

  while true do
    local sepStart, sepEnd = string.find(str, sep, start, true)
    if sepStart then
      table.insert(fields, string.sub(str, start, sepStart - 1))
      start = sepEnd + 1
    else
      table.insert(fields, string.sub(str, start))
      break
    end
  end

  return fields
end

-- Trim whitespace from both ends of a string
function trim(str)
  if str == nil then
    return ''
  end
  return str:match("^%s*(.-)%s*$")
end
