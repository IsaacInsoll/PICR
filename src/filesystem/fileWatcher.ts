import path from 'path';
import chokidar from 'chokidar';
import {Folder} from "../database";

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

    const relativePath = (path: string) => path.replace(directoryPath, '').replace(/^\//, "");
    const pathSplit = (path: string) => relativePath(path).split('/');
    const nestedFolders = async (path: string) => {
        const relative = relativePath(path);
        const [root] = await Folder.findOrCreate({where: {name: "", parentId: null}});
        if (relative === "") {
            return root;
        }
        let f = root;
        const ps = pathSplit(path);
        for (let i = 0; i < ps.length; i++) {
            console.log(['fid', f.id]);
            const [newFolder] = await Folder.findOrCreate({
                where: {
                    name: ps[i],
                    parentId: f.id,
                    fullPath: ps.slice(0, i + 1).join('/')
                }
            });
            f = newFolder;
        }
    }

    watcher
        // .on('add', path => log('➕ ' + path))
        .on('change', path => log('✖️ ' + path))
        // .on('unlink', path => log('➖ ' + path + 'has been removed'))
        .on('error', error => console.log('⚠️ Error happened: ' + error))
        .on('addDir', (path => {
            nestedFolders(path);
            log(`📁➕ ${relativePath(path)}`);
        }))
        .on('unlinkDir', (path => {
            Folder.findOne({where: {fullPath: relativePath(path)}}).then((folder) => {
                if (folder) folder.destroy().then(() => log(`📁➖ ${relativePath(path)}`));
            })
        }))
        .on('ready', () => {
            initComplete = true;
            console.log('✅ Initial scan complete. Ready for changes')
        })

}
