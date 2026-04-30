import { randomUUID } from "node:crypto";
import { Collection } from "../../domain/entities/collection";
import type { CreateCollectionCommandHandler } from "../../application/cqrs/contracts/commands/create-collection.command-handler";
import type { CreateCollectionCommand } from "../../application/cqrs/contracts/commands/create-collection.command";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

export class CreateCollectionCommandMysqlImpl implements CreateCollectionCommandHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    const id = randomUUID();
    const sql = `
      INSERT INTO collections (
        id, slug, name, color_hex, cover_image_url, description, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await this.mysqlClient.getPool().execute(sql, [
      id,
      command.slug,
      command.name,
      command.colorHex,
      command.coverImageUrl,
      command.description,
      command.isActive ? 1 : 0,
      command.displayOrder
    ]);

    return Collection.reconstitute({
      id,
      slug: command.slug,
      name: command.name,
      colorHex: command.colorHex,
      coverImageUrl: command.coverImageUrl,
      description: command.description,
      isActive: command.isActive,
      displayOrder: command.displayOrder
    });
  }
}
