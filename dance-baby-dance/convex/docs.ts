import type { DocumentByName } from "convex/server";
import type { DataModel, TableName } from "./typed";

export type Doc<T extends TableName> = DocumentByName<DataModel, T>;
