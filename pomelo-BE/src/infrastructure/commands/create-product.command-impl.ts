import { randomUUID } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";
import type { Product } from "../../domain/entities/product";
import type { CreateProductCommandHandler } from "../../application/cqrs/contracts/commands/create-product.command-handler";
import type { CreateProductCommand } from "../../application/cqrs/contracts/commands/create-product.command";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

export class CreateProductCommandMysqlImpl implements CreateProductCommandHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  private async replaceProductDetails(
    connection: PoolConnection,
    productId: string,
    variants: Product["variants"],
    sizes: string[]
  ): Promise<void> {
    await connection.execute(
      `DELETE pvi FROM product_variant_images pvi
       INNER JOIN product_variants pv ON pv.id = pvi.product_variant_id
       WHERE pv.product_id = ?`,
      [productId]
    );
    await connection.execute("DELETE FROM product_variants WHERE product_id = ?", [productId]);
    await connection.execute("DELETE FROM product_colors WHERE product_id = ?", [productId]);
    await connection.execute("DELETE FROM product_sizes WHERE product_id = ?", [productId]);
    await connection.execute("DELETE FROM product_images WHERE product_id = ?", [productId]);

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      const variantId = randomUUID();

      await connection.execute(
        `INSERT INTO product_variants (
          id, product_id, fabric_color_name, fabric_color_hex, print_color_name, print_color_hex, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          variantId,
          productId,
          variant.fabricColor.name,
          variant.fabricColor.hex,
          variant.printColor.name,
          variant.printColor.hex,
          index + 1
        ]
      );

      for (let imageIndex = 0; imageIndex < variant.images.length; imageIndex += 1) {
        await connection.execute(
          "INSERT INTO product_variant_images (id, product_variant_id, url, sort_order) VALUES (?, ?, ?, ?)",
          [randomUUID(), variantId, variant.images[imageIndex], imageIndex + 1]
        );
      }
    }

    for (const size of sizes) {
      await connection.execute(
        "INSERT INTO product_sizes (id, product_id, size_value) VALUES (?, ?, ?)",
        [randomUUID(), productId, size]
      );
    }
  }

  async execute(command: CreateProductCommand): Promise<Product> {
    const id = randomUUID();
    const connection = await this.mysqlClient.getPool().getConnection();

    const variants = command.variants;
    const sizes = command.availableSizes ?? [];

    const sql = `
      INSERT INTO products (
        id, slug, sku, name, category, collection, price_ars, description, subtitle,
        rating, shipping_info, fabric_care, is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, NOW(), NOW())
    `;

    try {
      await connection.beginTransaction();
      await connection.execute(sql, [
        id,
        command.slug,
        command.sku,
        command.name,
        command.category,
        command.collection,
        command.priceArs,
        command.description,
        command.subtitle,
        command.rating,
        command.shippingInfo,
        command.fabricCare,
        command.isActive ? 1 : 0
      ]);

      await this.replaceProductDetails(connection, id, variants, sizes);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return {
      id,
      slug: command.slug,
      sku: command.sku,
      name: command.name,
      category: command.category,
      collection: command.collection,
      priceArs: command.priceArs,
      description: command.description,
      subtitle: command.subtitle,
      rating: command.rating,
      variants,
      availableSizes: sizes,
      shippingInfo: command.shippingInfo,
      fabricCare: command.fabricCare,
      isActive: command.isActive
    };
  }
}
