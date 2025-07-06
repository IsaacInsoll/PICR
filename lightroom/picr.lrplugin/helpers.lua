function split(str, sep)
    local fields = {}
    local pattern = str.format("([^%s]+)", sep)
    str:gsub(pattern, function(c) fields[#fields + 1] = c end)
    return fields
end

function map(tbl, f)
    local t = {}
    for k, v in pairs(tbl) do
        t[k] = f(v)
    end
    return t
end

function filter(tbl, f)
    local t = {}
    for k, v in pairs(tbl) do
        if f(v) then
            table.insert(t, v)
        end
    end
    return t
end

function in_array(tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end
