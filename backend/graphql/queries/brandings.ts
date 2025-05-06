import { requireFullAdmin } from "./admins.js";
import { brandingType } from "../types/brandingType.js";
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { addFolderRelationship } from "../helpers/addFolderRelationship.js";
import { db } from "../../db/picrDb.js";
import { PicrRequestContext } from "../../types/PicrRequestContext.js";

const resolver = async (_, params, context: PicrRequestContext) => {
  await requireFullAdmin(context);
  const list = await db.query.dbBranding.findMany();
  return addFolderRelationship(list);
};

export const brandings = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(brandingType))),
  resolve: resolver,
};
