import path from 'path';
import chokidar from 'chokidar';
import {Folder, sequelize} from "../database";
import crypto from "crypto";
import {readdirSync} from "node:fs";
import {Op} from "sequelize";

export const fileWatcher = () => {
    let initComplete = false;
    const directoryPath = path.join(process.cwd(), 'media');
    console.log("👀 Now watching: " + directoryPath);

    const watcher = chokidar.watch(directoryPath, {ignored: /^\./, persistent: true, awaitWriteFinish: true});

    const log = (message: string) => {
        if (true || initComplete) {
            console.log(message);
        }
    }

    // BASIC PATH FUNCTIONS
    const relativePath = (path: string) => path.replace(directoryPath, '').replace(/^\//, "");
    const fullPath = (relativePath: string) => directoryPath + '/' + relativePath;
    const pathSplit = (path: string) => relativePath(path).split('/');

    // FOLDER OPERATIONS

    const createFolder = async (path: string) => {
        const relative = relativePath(path);
        const [root] = await Folder.findOrCreate({where: {name: "", parentId: null}});
        if (relative === "") {
            return root;
        }
        let f = root;
        const ps = pathSplit(path);
        for (let i = 0; i < ps.length; i++) {
            const [newFolder, created] = await Folder.findOrCreate({
                where: {
                    name: ps[i],
                    parentId: f.id,
                    fullPath: ps.slice(0, i + 1).join('/')
                }
            });
            // if (created) {
            updateFolderHash(newFolder);
            // }
            f = newFolder;
        }
    }


    // We can't detect folder renames, so lets compare hash of folder contents to work out if it's a rename?
    const updateFolderHash = (folder: Folder) => {
        const fileNames = readdirSync(fullPath(folder.fullPath)).join('#');
        const hash = crypto.createHash('md5').update(fileNames).digest('hex');
        if (folder.folderHash != hash) {
            console.log('#️⃣ Updating Folder hash: ', folder.fullPath, ' from ', folder.folderHash, ' to ', hash);
            folder.folderHash = hash;
            folder.save();
        }
    }

    const deleteFolder = async (path: string) => {
        // wait 1 sec, then see if a 'matching' folder was added in last 5 seconds, due to fileWatcher not detecting renames
        // don't filter including parentId as it might be a cut/paste from different folder levels???
        await delay(1000);
        Folder.findOne({where: {fullPath: relativePath(path)}}).then((folder) => {
            if (folder) {
                Folder.findOne({
                    where: {
                        folderHash: folder.folderHash,
                        createdAt: {[Op.gte]: sequelize.literal("DATETIME(CURRENT_TIMESTAMP,'-5 second')")}
                    }
                }).then(newFolder => {
                    if (newFolder) {
                        //TODO: Handle folder rename (move data across?)
                        console.log('🔀 Appears to be folder Rename from ', folder.fullPath, ' to ', newFolder.fullPath)
                        // console.log(newFolder);
                    }
                    folder.destroy().then(() => log(`📁➖ ${relativePath(path)}`));
                });
            }
        })
    }

    watcher
        // .on('add', path => log('➕ ' + path))
        // .on('change', path => log('✖️ ' + path))
        // .on('unlink', path => log('➖ ' + path))
        .on('error', error => console.log('⚠️ Error happened: ' + error))
        .on('addDir', (path => {
            //TODO: this event might be followed by a 'unlinkDir' as that's how renames are handled
            // You can tell at this point because the hash will match an existing folder that's about to be deleted
            // but that could also be a 'folder was copy pasted' so either wait to confirm, or handle this as a new folder then migrate when folder deleted?
            createFolder(path);
            log(`📁➕ ${relativePath(path)}`);
        }))
        .on('unlinkDir', (path => {
            deleteFolder(path);
        }))
        .on('ready', () => {
            initComplete = true;
            console.log('✅ Initial scan complete. Ready for changes')
        })

}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
