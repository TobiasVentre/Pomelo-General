import assert from "node:assert/strict";
import test from "node:test";
import { GetCollectionsQueryMysqlImpl } from "../../../src/infrastructure/queries/get-collections.query-impl";
import { createMockMysqlClient, createMockPool } from "../helpers/mock-mysql-client";

function makeCollectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-1", slug: "azul", name: "Azul", color_hex: "#2f4f77",
    cover_image_url: "https://example.com/azul.jpg",
    description: "Desc", is_active: 1, display_order: 1,
    ...overrides
  };
}

test("GetCollectionsQueryMysqlImpl returns empty array when no rows", async () => {
  const pool = createMockPool([[]]);
  const client = createMockMysqlClient(pool);
  const result = await new GetCollectionsQueryMysqlImpl(client as never).execute({});
  assert.deepEqual(result, []);
});

test("GetCollectionsQueryMysqlImpl maps DB row to Collection", async () => {
  const pool = createMockPool([[makeCollectionRow()]]);
  const client = createMockMysqlClient(pool);
  const result = await new GetCollectionsQueryMysqlImpl(client as never).execute({});
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "uuid-1");
  assert.equal(result[0].colorHex, "#2f4f77");
  assert.equal(result[0].isActive, true);
});

test("GetCollectionsQueryMysqlImpl maps is_active=0 to false", async () => {
  const pool = createMockPool([[makeCollectionRow({ is_active: 0 })]]);
  const client = createMockMysqlClient(pool);
  const [col] = await new GetCollectionsQueryMysqlImpl(client as never).execute({ activeOnly: false });
  assert.equal(col.isActive, false);
});
