import type { RowDataPacket } from "mysql2";
import type { Product } from "../../domain/entities/product";
import type { GetProductsQueryHandler } from "../../application/cqrs/contracts/queries/get-products.query-handler";
import type { GetProductsQuery } from "../../application/cqrs/contracts/queries/get-products.query";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

type ProductRow = RowDataPacket & {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string;
  collection: string;
  price_ars: number;
  description: string;
  subtitle: string;
  rating: number;
  shipping_info: string;
  fabric_care: string;
  is_active: number;
  color_name: string | null;
  color_hex: string | null;
  size_value: string | null;
  image_url: string | null;
};

export class GetProductsQueryMysqlImpl implements GetProductsQueryHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  async execute(query: GetProductsQuery): Promise<Product[]> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: Array<string | number> = [];

    if (query.slug) {
      conditions.push("p.slug = ?");
      params.push(query.slug);
    }

    if (query.collection) {
      conditions.push("p.collection = ?");
      params.push(query.collection);
    }

    if (query.category) {
      conditions.push("p.category = ?");
      params.push(query.category);
    }

    if (query.activeOnly !== false) {
      conditions.push("p.is_active = 1");
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const idSql = `
      SELECT p.id
      FROM products p
      ${whereClause}
      ORDER BY p.display_order ASC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const idParams = [...params, pageSize, offset];
    const [idRows] = await this.mysqlClient.getPool().query<Array<RowDataPacket & { id: string }>>(
      idSql,
      idParams
    );

    if (idRows.length === 0) {
      return [];
    }

    const ids = idRows.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(", ");
    const detailsSql = `
      SELECT
        p.id, p.slug, p.sku, p.name, p.category, p.collection,
        p.price_ars, p.description, p.subtitle, p.rating, p.shipping_info, p.fabric_care, p.is_active,
        pc.name AS color_name, pc.hex AS color_hex,
        ps.size_value,
        pi.url AS image_url
      FROM products p
      LEFT JOIN product_colors pc ON pc.product_id = p.id
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.id IN (${placeholders})
      ORDER BY p.display_order ASC, p.created_at DESC
    `;

    const [rows] = await this.mysqlClient.getPool().query<ProductRow[]>(detailsSql, ids);
    const map = new Map<string, Product>();

    rows.forEach((row) => {
      const current = map.get(row.id);
      if (!current) {
        map.set(row.id, {
          id: row.id,
          slug: row.slug,
          sku: row.sku,
          name: row.name,
          category: row.category,
          collection: row.collection,
          priceArs: Number(row.price_ars),
          description: row.description,
          subtitle: row.subtitle,
          rating: Number(row.rating ?? 0),
          availableColors: [],
          availableSizes: [],
          images: [],
          shippingInfo: row.shipping_info,
          fabricCare: row.fabric_care,
          isActive: row.is_active === 1
        });
      }

      const product = map.get(row.id)!;

      if (row.color_name && row.color_hex) {
        const exists = product.availableColors.some(
          (c) => c.name === row.color_name && c.hex === row.color_hex
        );
        if (!exists) {
          product.availableColors.push({ name: row.color_name, hex: row.color_hex });
        }
      }

      if (row.size_value && !product.availableSizes.includes(row.size_value)) {
        product.availableSizes.push(row.size_value);
      }

      if (row.image_url && !product.images.includes(row.image_url)) {
        product.images.push(row.image_url);
      }
    });

    const productsById = new Map(Array.from(map.entries()));
    return ids
      .map((id) => productsById.get(id))
      .filter((product): product is Product => product !== undefined);
  }
}
