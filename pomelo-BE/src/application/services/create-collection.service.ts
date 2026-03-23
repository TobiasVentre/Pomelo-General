import type { Collection } from "../../domain/entities/collection";
import type { CreateCollectionCommand } from "../cqrs/contracts/commands/create-collection.command";
import type { CreateCollectionCommandHandler } from "../cqrs/contracts/commands/create-collection.command-handler";

export class CreateCollectionService {
  constructor(private readonly commandHandler: CreateCollectionCommandHandler) {}

  execute(command: CreateCollectionCommand): Promise<Collection> {
    return this.commandHandler.execute(command);
  }
}
