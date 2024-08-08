import { delay } from '../../helpers/delay';
import Folder from '../../models/Folder';
import { folderList, relativePath } from '../fileManager';
import { Op, literal } from 'sequelize';
import { logger } from '../../logger';

export const removeFolder = async (path: string) => {
  // wait 1 sec, then see if a 'matching' folder was added in last 5 seconds, due to fileWatcher not detecting renames
  // don't filter including parentId as it might be a cut/paste from different folder levels???
  await delay(1000);
  Folder.findOne({ where: { relativePath: relativePath(path) } }).then(
    (folder) => {
      if (folder) {
        Folder.findOne({
          where: {
            folderHash: folder.folderHash,
            createdAt: {
              [Op.gte]: literal("NOW() - interval '5' second"), //postgres
              // [Op.gte]: literal("DATETIME(CURRENT_TIMESTAMP,'-5 second')"), //mysql
            },
          },
        }).then((newFolder) => {
          if (newFolder) {
            //TODO: Handle folder rename (move data across?)
            logger(
              `🔀 Appears to be folder Rename from ${folder.relativePath} to ${newFolder.relativePath}`,
            );
          }
          folderList[relativePath(path)] = undefined;
          // console.log(folderList);
          folder.destroy().then(() => logger(`📁➖ ${relativePath(path)}`));
        });
      }
    },
  );
};
