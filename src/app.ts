import express from 'express';
import {fileWatcher} from './filesystem/fileWatcher'
import pkg from '../package.json';
import {Folder, sequelize} from "./database";
import {config} from 'dotenv'
import {gqlserver} from "./gql";

const app = async () => {
    config(); // read .ENV
    console.log(['ds', process.env.DEBUG_SQL]);

    const server = express();
    const port = 6900;
    const appName = pkg.name;

    await sequelize.sync({}); // build DB
    fileWatcher();

    server.all("/graphql", gqlserver);

    server.get('/', (req, res) => {
        console.log('request received!');
        Folder.findAll().then(folders => res.send(JSON.stringify(folders.map(({id, name, folderHash, createdAt}) => ({
            id,
            name,
            folderHash,
            createdAt
        })))))
        // res.send('Hello, World! 🌍');
    });

    server.listen(port, () => {
        console.log(`🌐 App listening at http://localhost:${port}`);
    });

//Close all the stuff
    process.on('exit', function () {
        sequelize.close().then(() => {
            console.log(`💀 ${appName} Closed`);
        });

    });

// This is CTRL+C While it's running, trigger a nice shutdown
    process.on('SIGINT', function () {
        console.log(`❌ Shutting down ${appName}`);
        process.exit(0);
    });

}

app();