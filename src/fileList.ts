import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';

// export const directoryList = async (dir: string) => {
//     const directoryPath = path.join(__dirname, '..','media',dir);
//     console.log(directoryPath);
//     try {
//         return await fs.promises.readdir(directoryPath);
//       } catch (err) {
//         console.error('Error occurred while reading directory:', err)
//       }
// }

export const fileWatcher = () => {
    var initComplete = false;
    const directoryPath = path.join(process.cwd(), 'media');
    console.log("👀 Now watching: " + directoryPath);

    var watcher = chokidar.watch(directoryPath, {ignored: /^\./, persistent: true, awaitWriteFinish: true});

    const log = (message: string) => {
        if(initComplete) {
            console.log(message);
        }
    }

    watcher
        .on('add', path => log('➕ '+ path))
        .on('change', path => log('✖️ '+ path))
        .on('unlink', path => log('➖ '+ path+ 'has been removed'))
        .on('error', error => console.log('⚠️ Error happened: '+ error))
        .on('addDir', path => log(`📁➕ ${path}`))
        .on('unlinkDir', path => log(`📁➖ ${path}`))
        .on('ready', () => {
            initComplete = true;
            console.log('✅ Initial scan complete. Ready for changes')
        })

}