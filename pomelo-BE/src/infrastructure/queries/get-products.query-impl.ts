import type { RowDataPacket } from "mysql2";
import type { Product, ProductColor, ProductVariant } from "../../domain/entities/product";
import type { GetProductsQueryHandler } from "../../application/cqrs/contracts/queries/get-products.query-handler";
import type { GetProductsQuery } from "../../application/cqrs/contracts/queries/get-products.query";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

type ProductBaseRow = RowDataPacket & {
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
};

type ProductSizeRow = RowDataPacket & {
  product_id: string;
  size_value: string;
};

type ProductVariantRow = RowDataPacket & {
  product_id: string;
  variant_id: string;
  variant_sort_order: number;
  fabric_color_name: string;
  fabric_color_hex: string;
  print_color_name: string;
  print_color_hex: string;
  image_url: string | null;
};

type LegacyColorRow = RowDataPacket & {
  product_id: string;
  name: string;
  hex: string;
};

type LegacyImageRow = RowDataPacket & {
  product_id: string;
  url: string;
};

type ProductVariantAccumulator = {
  variantId: string;
  sortOrder: number;
  variant: ProductVariant;
};

function buildDefaultLegacyColor(product: Product): ProductColor {
  return {
    name: product.collection,
    hex: product.collection === "Azul" ? "#2f4f77" : "#b9a798"
  };
}

export class GetProductsQueryMysqlImpl implements GetProductsQueryHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  private async loadBaseProducts(ids: string[]): Promise<Map<string, Product>> {
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `
      SELECT
        p.id, p.slug, p.sku, p.name, p.category, p.collection,
        p.price_ars, p.description, p.subtitle, p.rating, p.shipping_info, p.fabric_care, p.is_active
      FROM products p
      WHERE p.id IN (${placeholders})
      ORDER BY p.display_order ASC, p.created_at DESC
    `;
    const [rows] = await this.mysqlClient.getPool().query<ProductBaseRow[]>(sql, ids);
    const products = new Map<string, Product>();

    rows.forEach((row) => {
      products.set(row.id, {
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
        variants: [],
        availableSizes: [],
        shippingInfo: row.shipping_info,
        fabricCare: row.fabric_care,
        isActive: row.is_active === 1
      });
    });

    return products;
  }

  private async loadSizes(ids: string[], products: Map<string, Product>): Promise<void> {
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `
      SELECT product_id, size_value
      FROM product_sizes
      WHERE product_id IN (${placeholders})
      ORDER BY product_id ASC, size_value ASC
    `;
    const [rows] = await this.mysqlClient.getPool().query<ProductSizeRow[]>(sql, ids);

    rows.forEach((row) => {
      const product = products.get(row.product_id);
      if (!product || product.availableSizes.includes(row.size_value)) {
        return;
      }

      product.availableSizes.push(row.size_value);
    });
  }

  private async loadVariants(ids: string[], products: Map<string, Product>): Promise<void> {
    const placeholders = ids.map(() => "?").join(", ");
    const sql = `
      SELECT
        pv.product_id,
        pv.id AS variant_id,
        pv.sort_order AS variant_sort_order,
        pv.fabric_color_name,
        pv.fabric_color_hex,
        pv.print_color_name,
        pv.print_color_hex,
        pvi.url AS image_url
      FROM product_variants pv
      LEFT JOIN product_variant_images pvi ON pvi.product_variant_id = pv.id
      WHERE pv.product_id IN (${placeholders})
      ORDER BY pv.product_id ASC, pv.sort_order ASC, pvi.sort_order ASC
    `;
    const [rows] = await this.mysqlClient.getPool().query<ProductVariantRow[]>(sql, ids);
    const variantsByProductId = new Map<string, ProductVariantAccumulator[]>();

    rows.forEach((row) => {
      const product = products.get(row.product_id);
      if (!product) {
        return;
      }

      const currentVariants = variantsByProductId.get(row.product_id) ?? [];
      let currentVariant = currentVariants.find((entry) => entry.variantId === row.variant_id);

      if (!currentVariant) {
        currentVariant = {
          variantId: row.variant_id,
          sortOrder: Number(row.variant_sort_order ?? currentVariants.length + 1),
          variant: {
            fabricColor: {
              name: row.fabric_color_name,
              hex: row.fabric_color_hex
            },
            printColor: {
              name: row.print_color_name,
              hex: row.print_color_hex
            },
            images: []
          }
        };
        currentVariants.push(currentVariant);
        variantsByProductId.set(row.product_id, currentVariants);
      }

      if (row.image_url && !currentVariant.variant.images.includes(row.image_url)) {
        currentVariant.variant.images.push(row.image_url);
      }
    });

    variantsByProductId.forEach((variants, productId) => {
      const product = products.get(productId);
      if (!product) {
        return;
      }

      product.variants = variants
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((entry) => entry.variant);
    });
  }

  private async loadLegacyFallbackVariants(ids: string[], products: Map<string, Product>): Promise<void> {
    const missingIds = ids.filter((id) => (products.get(id)?.variants.length ?? 0) === 0);

    if (missingIds.length === 0) {
      return;
    }

    const placeholders = missingIds.map(() => "?").join(", ");
    const [legacyColorRows] = await this.mysqlClient.getPool().query<LegacyColorRow[]>(
      `SELECT product_id, name, hex
       FROM product_colors
       WHERE product_id IN (${placeholders})
       ORDER BY product_id ASC, id ASC`,
      missingIds
    );
    const [legacyImageRows] = await this.mysqlClient.getPool().query<LegacyImageRow[]>(
      `SELECT product_id, url
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY product_id ASC, sort_order ASC`,
      missingIds
    );
    const legacyColorsByProduct = new Map<string, ProductColor[]>();
    const legacyImagesByProduct = new Map<string, string[]>();

    legacyColorRows.forEach((row) => {
      const colors = legacyColorsByProduct.get(row.product_id) ?? [];
      const alreadyExists = colors.some((color) => color.name === row.name && color.hex === row.hex);

      if (!alreadyExists) {
        colors.push({ name: row.name, hex: row.hex });
        legacyColorsByProduct.set(row.product_id, colors);
      }
    });

    legacyImageRows.forEach((row) => {
      const images = legacyImagesByProduct.get(row.product_id) ?? [];

      if (!images.includes(row.url)) {
        images.push(row.url);
        legacyImagesByProduct.set(row.product_id, images);
      }
    });

    missingIds.forEach((productId) => {
      const product = products.get(productId);
      if (!product) {
        return;
      }

      const fallbackColor = legacyColorsByProduct.get(productId)?.[0] ?? buildDefaultLegacyColor(product);

      product.variants = [
        {
          fabricColor: fallbackColor,
          printColor: fallbackColor,
          images: legacyImagesByProduct.get(productId) ?? []
        }
      ];
    });
  }

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
    const products = await this.loadBaseProducts(ids);
    await Promise.all([
      this.loadSizes(ids, products),
      this.loadVariants(ids, products)
    ]);
    await this.loadLegacyFallbackVariants(ids, products);

    return ids
      .map((id) => products.get(id))
      .filter((product): product is Product => product !== undefined);
  }
}
