import type { Collection } from "../../../../domain/entities/collection";
import type { CreateCollectionCommand } from "./create-collection.command";

export interface CreateCollectionCommandHandler {
  execute(command: CreateCollectionCommand): Promise<Collection>;
}
