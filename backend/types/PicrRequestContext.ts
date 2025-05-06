import { FolderFields, UserFields } from "../db/picrDb.js";
import { IncomingCustomHeaders } from "./incomingCustomHeaders.js";
import { ExtraUserProps } from "../helpers/extraUserProps.js";

export type PicrRequestContext = {
  user?: UserFields;
  userHomeFolder?: FolderFields;
  headers: IncomingCustomHeaders;
} & ExtraUserProps;
