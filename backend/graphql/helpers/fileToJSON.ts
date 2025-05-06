import { FileFields } from "../../db/picrDb.js";

export const fileToJSON = (f: FileFields) => {
  return { ...f, metadata: f.metadata ? JSON.parse(f.metadata) : undefined };
};
