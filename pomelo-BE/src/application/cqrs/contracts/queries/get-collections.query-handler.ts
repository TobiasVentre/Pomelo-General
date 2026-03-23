import type { Collection } from "../../../../domain/entities/collection";
import type { GetCollectionsQuery } from "./get-collections.query";

export interface GetCollectionsQueryHandler {
  execute(query: GetCollectionsQuery): Promise<Collection[]>;
}
