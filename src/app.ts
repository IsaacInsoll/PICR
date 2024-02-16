import express from 'express';
import {setupDatabase} from './setupDatabase';
import {fileWatcher} from './fileList'
import pkg from '../package.json';


const app = express();
const port = 6900;
const appName = pkg.name;

let db = setupDatabase();
fileWatcher(db);

app.get('/', (req, res) => {
    console.log('request received!');
    res.send('Hello, World! 🌍');
});

app.listen(port, () => {
    console.log(`🌐 App listening at http://localhost:${port}`);
});

//Close all the stuff
process.on('exit', function () {
    db.close();
    console.log(`💀 ${appName} Closed`);
});


// This is CTRL+C While it's running, trigger a nice shutdown
process.on('SIGINT', function () {
    console.log(`❌ Shutting down ${appName}`);
    process.exit(0);
});
