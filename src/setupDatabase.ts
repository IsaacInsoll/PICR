import {Database} from 'sqlite3';

export const setupDatabase = () => {
    let db = new Database('./data/picr.sqlite', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('✅ Connected to the database.');
        migrateDatabase(db);
    });
    return db;
};

const migrateDatabase = (db: Database) => {
    // create/update tables and migrate if necessary
    // TODO: better schema updates, i'm sure there is probably a package for this?
    db.run(`CREATE TABLE IF NOT EXISTS Directory
            (
                folder_id INTEGER PRIMARY KEY,
                folder_path TEXT NOT NULL
            )`);
}