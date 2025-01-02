import { delay } from '../../helpers/delay';
import FolderModel from '../../db/FolderModel';
import { folderList, relativePath } from '../fileManager';
import { literal, Op } from 'sequelize';
import { log } from '../../logger';

export const removeFolder = async (path: string) => {
  // wait 1 sec, then see if a 'matching' folder was added in last 5 seconds, due to fileWatcher not detecting renames
  // don't filter including parentId as it might be a cut/paste from different folder levels???
  await delay(1000);
  FolderModel.findOne({ where: { relativePath: relativePath(path) } }).then(
    (folder) => {
      if (folder) {
        FolderModel.findOne({
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
            log(
              'info',
              `🔀 Appears to be folder Rename from ${folder.relativePath} to ${newFolder.relativePath}`,
            );
          }
          folderList[relativePath(path)] = undefined;
          // console.log(folderList);
          folder
            .destroy()
            .then(() => log('info', `📁➖ ${relativePath(path)}`));
        });
      }
    },
  );
};
