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
