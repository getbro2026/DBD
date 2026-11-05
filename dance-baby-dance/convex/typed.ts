// Typed builders for this schema. They do what convex/_generated/server does, so the code type-checks
// before `npx convex dev` has generated anything.
import {
  DataModelFromSchemaDefinition,
  GenericMutationCtx,
  GenericQueryCtx,
  MutationBuilder,
  QueryBuilder,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import { GenericId } from "convex/values";
import schema from "./schema";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type TableName = keyof DataModel & string;
export type Id<T extends TableName> = GenericId<T>;
export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;

export const query: QueryBuilder<DataModel, "public"> = queryGeneric;
export const mutation: MutationBuilder<DataModel, "public"> = mutationGeneric;
