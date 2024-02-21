import {buildSchema} from "graphql";
import {createHandler} from "graphql-http/lib/use/express";
import {Folder} from "./database";


const schema = buildSchema(/*GraphQL */`
    type Query {
        folders(parentId: ID): [Folder!]!
        folder(id: ID!): Folder!
    }
    type Folder {
        id: ID!
        name: String!
        parentId: ID
    }

`)

const root = {
    folder: async (params) => {
        const folder = await Folder.findOne({where: {id: params.id}});
        return folder.toJSON();

    },
    folders: async (params) => {
        const parentId = params.parentId ?? 1;
        console.log(parentId);
        const folders = await Folder.findAll({where: {parentId}});
        const data = (folders.map(f => f.toJSON()));
        console.log(data);
        return data;

    },
}

export const gqlserver = createHandler({
    schema: schema,
    rootValue: root,
})