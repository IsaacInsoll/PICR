local LrTasks = import 'LrTasks'
local LrDialogs = import 'LrDialogs'
local LrLogger = import 'LrLogger'
local logger = LrLogger('PICR')
require 'activeFolder'
require 'picrDialog'

--logger:enable("logfile") -- log to LightroomPluginTemplate.log file in Documents folder
logger:enable("print") -- log to debug output

-- async task
LrTasks.startAsyncTask(function()
  local folder = Active_folder(sources);
  if folder == nil then
    LrDialogs.message('Sorry, you must have a Folder selected')
    return
  end
  PicrDialog(folder);
  -- LrDialogs.message(folder:getName() .. "\n" .. folder:getPath());
end)
