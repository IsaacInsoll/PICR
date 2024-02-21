import {DataTypes, Model, Sequelize, Transaction} from "sequelize";
import {config} from "dotenv";
import TYPES = Transaction.TYPES;

config(); // read .ENV

// DB FIELDS
const id = {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
};

const name = {
    type: DataTypes.STRING,
    allowNull: false
};
const hash = {
    type: DataTypes.STRING,
};

const fullPath = {
    type: DataTypes.STRING,
};


export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.cwd() + '/data/db.sqlite',
    logging: process.env.DEBUG_SQL == 'true',
    retry: {
        match: [
            /SQLITE_BUSY/
        ],
        name: 'query',
        max: 5
    },
    transactionType: TYPES.IMMEDIATE
});


export class Folder extends Model {
    declare name: string;
    declare folderHash: string;
    declare fullPath: string;
    declare parentId: number | null;
    declare id: number;
}

Folder.init({id, name, fullPath, folderHash: hash}, {sequelize, modelName: 'Folder'});

export class File extends Model {
    declare name: string;
    declare fullPath: string;
    declare folderId: number | null;
    declare id: number;
}

File.init({id, name, fullPath}, {sequelize, modelName: 'File'});

Folder.hasMany(File);
File.belongsTo(Folder);


Folder.belongsTo(Folder, {
    foreignKey: "parentId",
    as: 'parent'
});
Folder.hasMany(Folder, {
    foreignKey: "parentId",
    as: 'children'
});

