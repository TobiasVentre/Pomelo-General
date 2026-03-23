import type { Collection } from "../../domain/entities/collection";
import type { UpdateCollectionCommand } from "../cqrs/contracts/commands/update-collection.command";
import type { UpdateCollectionCommandHandler } from "../cqrs/contracts/commands/update-collection.command-handler";

export class UpdateCollectionService {
  constructor(private readonly commandHandler: UpdateCollectionCommandHandler) {}

  execute(command: UpdateCollectionCommand): Promise<Collection | null> {
    return this.commandHandler.execute(command);
  }
}
