import assert from "node:assert/strict";
import test from "node:test";
import { GetProductsQueryMysqlImpl } from "../../../src/infrastructure/queries/get-products.query-impl";
import { createMockMysqlClient, createMockPool } from "../helpers/mock-mysql-client";

function makeProductRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-1", slug: "remera", sku: "REM-001", name: "Remera",
    category: "Remeras", collection: "Azul", price_ars: 45000,
    description: "Desc", subtitle: "Sub", rating: 4,
    shipping_info: "Envio", fabric_care: "Algodon", is_active: 1,
    color_name: null, color_hex: null, size_value: null, image_url: null,
    ...overrides
  };
}

test("GetProductsQueryMysqlImpl returns empty array when no id rows", async () => {
  const pool = createMockPool([[]]);
  const client = createMockMysqlClient(pool);
  const query = new GetProductsQueryMysqlImpl(client as never);
  const result = await query.execute({ page: 1, pageSize: 10 });
  assert.deepEqual(result, []);
});

test("GetProductsQueryMysqlImpl maps DB rows to Product", async () => {
  const idRow = [{ id: "uuid-1" }];
  const detailRow = [makeProductRow()];
  const pool = createMockPool([idRow, detailRow]);
  const client = createMockMysqlClient(pool);
  const query = new GetProductsQueryMysqlImpl(client as never);
  const result = await query.execute({ page: 1, pageSize: 10 });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "uuid-1");
  assert.equal(result[0].priceArs, 45000);
  assert.equal(result[0].isActive, true);
});

test("GetProductsQueryMysqlImpl deduplicates colors and sizes across joined rows", async () => {
  const idRow = [{ id: "uuid-1" }];
  const detailRows = [
    makeProductRow({ color_name: "Azul", color_hex: "#2f4f77", size_value: "S" }),
    makeProductRow({ color_name: "Azul", color_hex: "#2f4f77", size_value: "M" }),
    makeProductRow({ color_name: "Azul", color_hex: "#2f4f77", size_value: "S" }),
  ];
  const pool = createMockPool([idRow, detailRows]);
  const client = createMockMysqlClient(pool);
  const query = new GetProductsQueryMysqlImpl(client as never);
  const [product] = await query.execute({ page: 1, pageSize: 10 });
  assert.equal(product.availableColors.length, 1);
  assert.deepEqual(product.availableSizes, ["S", "M"]);
});

test("GetProductsQueryMysqlImpl aggregates images without duplicates", async () => {
  const idRow = [{ id: "uuid-1" }];
  const url = "https://example.com/img.jpg";
  const detailRows = [
    makeProductRow({ image_url: url }),
    makeProductRow({ image_url: url }),
    makeProductRow({ image_url: "https://example.com/img2.jpg" }),
  ];
  const pool = createMockPool([idRow, detailRows]);
  const client = createMockMysqlClient(pool);
  const [product] = await new GetProductsQueryMysqlImpl(client as never).execute({ page: 1, pageSize: 10 });
  assert.equal(product.images.length, 2);
});

test("GetProductsQueryMysqlImpl preserves id ordering from pagination", async () => {
  const idRow = [{ id: "uuid-2" }, { id: "uuid-1" }];
  const detailRows = [
    makeProductRow({ id: "uuid-1" }),
    makeProductRow({ id: "uuid-2" }),
  ];
  const pool = createMockPool([idRow, detailRows]);
  const client = createMockMysqlClient(pool);
  const result = await new GetProductsQueryMysqlImpl(client as never).execute({ page: 1, pageSize: 10 });
  assert.equal(result[0].id, "uuid-2");
  assert.equal(result[1].id, "uuid-1");
});
