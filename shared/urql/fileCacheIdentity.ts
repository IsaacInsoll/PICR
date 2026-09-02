// File, Image and Video are runtime views of the same mutable Files-table row.
// Omitting their typenames from Graphcache keys keeps one identity when a
// rename/rescan changes the row's concrete media type.
export const fileGlobalIDs = ['File', 'Image', 'Video'] as const;
