import type { RowDataPacket } from "mysql2";
import type { Collection } from "../../domain/entities/collection";
import type { GetCollectionsQueryHandler } from "../../application/cqrs/contracts/queries/get-collections.query-handler";
import type { GetCollectionsQuery } from "../../application/cqrs/contracts/queries/get-collections.query";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

type CollectionRow = RowDataPacket & {
  id: string;
  slug: string;
  name: string;
  color_hex: string;
  cover_image_url: string;
  description: string;
  is_active: number;
  display_order: number;
};

export class GetCollectionsQueryMysqlImpl implements GetCollectionsQueryHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  async execute(query: GetCollectionsQuery): Promise<Collection[]> {
    const conditions: string[] = [];
    const params: string[] = [];

    if (query.slug) {
      conditions.push("slug = ?");
      params.push(query.slug);
    }

    if (query.activeOnly !== false) {
      conditions.push("is_active = 1");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT id, slug, name, color_hex, cover_image_url, description, is_active, display_order
      FROM collections
      ${whereClause}
      ORDER BY display_order ASC, name ASC
    `;

    const [rows] = await this.mysqlClient.getPool().query<CollectionRow[]>(sql, params);
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      colorHex: row.color_hex,
      coverImageUrl: row.cover_image_url,
      description: row.description,
      isActive: row.is_active === 1,
      displayOrder: row.display_order
    }));
  }
}
