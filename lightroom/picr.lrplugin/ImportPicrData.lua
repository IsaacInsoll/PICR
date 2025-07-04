local LrApplication = import 'LrApplication'
local LrTasks = import 'LrTasks'
local LrDialogs = import 'LrDialogs'

-- enable logging (in Documents folder)
local LrLogger = import 'LrLogger'
local logger = LrLogger('LightroomPluginTemplate')
--logger:enable("logfile") -- log to LightroomPluginTemplate.log file in Documents folder
logger:enable("print") -- log to debug output

logger:trace("This is LightroomPluginTemplate plugin")

-- async task
LrTasks.startAsyncTask (function()
  logger:trace("Async task")
end)

local version = LrApplication.versionTable()
local versionString = string.format("Lightroom version %d.%d", version.major, version.minor)
logger:trace(versionString)

local catalog = LrApplication.activeCatalog()


LrDialogs.message(versionString)