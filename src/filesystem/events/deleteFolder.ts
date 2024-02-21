import { delay } from '../../helpers/delay';
import { Folder } from '../../models/folder';
import { relativePath } from '../fileManager';
import { Op } from 'sequelize';
import { sequelize } from '../../database';

export const deleteFolder = async (path: string) => {
  // wait 1 sec, then see if a 'matching' folder was added in last 5 seconds, due to fileWatcher not detecting renames
  // don't filter including parentId as it might be a cut/paste from different folder levels???
  await delay(1000);
  Folder.findOne({ where: { fullPath: relativePath(path) } }).then((folder) => {
    if (folder) {
      Folder.findOne({
        where: {
          folderHash: folder.folderHash,
          createdAt: {
            [Op.gte]: sequelize.literal(
              "DATETIME(CURRENT_TIMESTAMP,'-5 second')",
            ),
          },
        },
      }).then((newFolder) => {
        if (newFolder) {
          //TODO: Handle folder rename (move data across?)
          console.log(
            `🔀 Appears to be folder Rename from ${folder.fullPath} to ${newFolder.fullPath}`,
          );
        }
        folder.destroy().then(() => {});
      });
    }
  });
};
