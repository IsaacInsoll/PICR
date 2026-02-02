-- PICR Lightroom Plugin
-- @copyright 2025 Isaac Insoll
-- @license: MIT
return {
  LrSdkVersion = 10.0,
  LrToolkitIdentifier = "com.isaacinsoll.picr.lr-plugin",
  LrPluginName = "PICR Lightroom Plugin",
  LrPluginInfoUrl = "https://github.com/IsaacInsoll/PICR/tree/master/lightroom",
  VERSION = {
    major = 0,
    minor = 2,
    revision = 1,
  },
  LrLibraryMenuItems = {
    {
      title = "Import PICR Data",
      file = "main.lua",
    },
  },
}
