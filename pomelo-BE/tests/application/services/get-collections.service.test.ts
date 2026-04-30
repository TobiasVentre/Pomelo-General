import assert from "node:assert/strict";
import test from "node:test";
import { GetCollectionsService } from "../../../src/application/services/get-collections.service";
import { Collection } from "../../../src/domain/entities/collection";

const collection = Collection.reconstitute({
  id: "uuid-1", slug: "azul", name: "Azul", colorHex: "#2f4f77",
  coverImageUrl: "https://example.com/azul.jpg", description: "Desc",
  isActive: true, displayOrder: 1
});

test("GetCollectionsService returns collections from handler", async () => {
  const handler = { execute: async () => [collection] };
  const result = await new GetCollectionsService(handler).execute({ activeOnly: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "uuid-1");
});

test("GetCollectionsService returns empty array when handler returns none", async () => {
  const handler = { execute: async () => [] };
  const result = await new GetCollectionsService(handler).execute({});
  assert.deepEqual(result, []);
});

test("GetCollectionsService propagates handler error", async () => {
  const handler = { execute: async () => { throw new Error("DB error"); } };
  await assert.rejects(new GetCollectionsService(handler).execute({}), /DB error/);
});
