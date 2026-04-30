import { Collection } from "../../domain/entities/collection";
import type { UpdateCollectionCommandHandler } from "../../application/cqrs/contracts/commands/update-collection.command-handler";
import type { UpdateCollectionCommand } from "../../application/cqrs/contracts/commands/update-collection.command";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

export class UpdateCollectionCommandMysqlImpl implements UpdateCollectionCommandHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  async execute(command: UpdateCollectionCommand): Promise<Collection | null> {
    const sql = `
      UPDATE collections
      SET slug = ?, name = ?, color_hex = ?, cover_image_url = ?, description = ?,
          is_active = ?, display_order = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await this.mysqlClient.getPool().execute(sql, [
      command.slug,
      command.name,
      command.colorHex,
      command.coverImageUrl,
      command.description,
      command.isActive ? 1 : 0,
      command.displayOrder,
      command.id
    ]);

    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affectedRows === 0) {
      return null;
    }

    return Collection.reconstitute({
      id: command.id,
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
