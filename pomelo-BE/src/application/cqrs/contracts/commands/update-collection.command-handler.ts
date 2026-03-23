import type { Collection } from "../../../../domain/entities/collection";
import type { UpdateCollectionCommand } from "./update-collection.command";

export interface UpdateCollectionCommandHandler {
  execute(command: UpdateCollectionCommand): Promise<Collection | null>;
}
