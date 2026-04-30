import { randomUUID } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";
import { Product } from "../../domain/entities/product";
import type { CreateProductCommandHandler } from "../../application/cqrs/contracts/commands/create-product.command-handler";
import type { CreateProductCommand } from "../../application/cqrs/contracts/commands/create-product.command";
import type { MysqlClient } from "../persistence/mysql/mysql-client";

export class CreateProductCommandMysqlImpl implements CreateProductCommandHandler {
  constructor(private readonly mysqlClient: MysqlClient) {}

  private async replaceProductDetails(
    connection: PoolConnection,
    productId: string,
    colors: Product["availableColors"],
    sizes: string[],
    images: string[]
  ): Promise<void> {
    await connection.execute("DELETE FROM product_colors WHERE product_id = ?", [productId]);
    await connection.execute("DELETE FROM product_sizes WHERE product_id = ?", [productId]);
    await connection.execute("DELETE FROM product_images WHERE product_id = ?", [productId]);

    for (const color of colors) {
      await connection.execute(
        "INSERT INTO product_colors (id, product_id, name, hex) VALUES (?, ?, ?, ?)",
        [randomUUID(), productId, color.name, color.hex]
      );
    }

    for (const size of sizes) {
      await connection.execute(
        "INSERT INTO product_sizes (id, product_id, size_value) VALUES (?, ?, ?)",
        [randomUUID(), productId, size]
      );
    }

    for (let index = 0; index < images.length; index += 1) {
      const type = index === 0 ? "thumbnail" : index === 1 ? "hover" : "gallery";
      await connection.execute(
        "INSERT INTO product_images (id, product_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)",
        [randomUUID(), productId, type, images[index], index + 1]
      );
    }
  }

  async execute(command: CreateProductCommand): Promise<Product> {
    const id = randomUUID();
    const connection = await this.mysqlClient.getPool().getConnection();

    const colors = command.availableColors ?? [];
    const sizes = command.availableSizes ?? [];
    const images = command.images ?? [];

    const colorCombos = command.colorCombos ?? [];
    const sql = `
      INSERT INTO products (
        id, slug, sku, name, category, collection, price_ars, description, subtitle,
        rating, shipping_info, fabric_care, is_active, color_combos, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, NOW(), NOW())
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
        command.isActive ? 1 : 0,
        colorCombos.length > 0 ? JSON.stringify(colorCombos) : null
      ]);

      await this.replaceProductDetails(connection, id, colors, sizes, images);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return Product.reconstitute({
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
      availableColors: colors,
      availableSizes: sizes,
      images,
      colorCombos,
      shippingInfo: command.shippingInfo,
      fabricCare: command.fabricCare,
      isActive: command.isActive
    });
  }
}
