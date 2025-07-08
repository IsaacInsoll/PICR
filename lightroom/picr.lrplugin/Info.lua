-- PICR Lightroom Plugin
-- @copyright 2025 Isaac Insoll
-- @license: TBD
return {
  LrSdkVersion = 10.0,
  LrToolkitIdentifier = "com.isaacinsoll.picr.lr-plugin",
  LrPluginName = "PICR Lightroom Plugin",
  LrPluginInfoUrl = "",
  VERSION = {
    major = 0,
    minor = 1,
    revision = 0,
  },
  LrLibraryMenuItems = {
    {
      title = "Import PICR Data",
      file = "main.lua",
    },
  },
}
