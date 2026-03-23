import type { Collection } from "../../domain/entities/collection";
import type { GetCollectionsQuery } from "../cqrs/contracts/queries/get-collections.query";
import type { GetCollectionsQueryHandler } from "../cqrs/contracts/queries/get-collections.query-handler";

export class GetCollectionsService {
  constructor(private readonly queryHandler: GetCollectionsQueryHandler) {}

  execute(query: GetCollectionsQuery): Promise<Collection[]> {
    return this.queryHandler.execute(query);
  }
}
