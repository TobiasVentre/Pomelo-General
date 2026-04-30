import assert from "node:assert/strict";
import test from "node:test";
import { UpdateCollectionService } from "../../../src/application/services/update-collection.service";
import { Collection } from "../../../src/domain/entities/collection";

const command = {
  id: "uuid-1", slug: "azul", name: "Azul", colorHex: "#2f4f77",
  coverImageUrl: "https://example.com/azul.jpg", description: "Desc",
  isActive: true, displayOrder: 1
};

const collection = Collection.reconstitute(command);

test("UpdateCollectionService returns updated collection", async () => {
  const handler = { execute: async () => collection };
  const result = await new UpdateCollectionService(handler).execute(command);
  assert.deepEqual(result, collection);
});

test("UpdateCollectionService returns null when not found", async () => {
  const handler = { execute: async () => null };
  const result = await new UpdateCollectionService(handler).execute(command);
  assert.equal(result, null);
});

test("UpdateCollectionService propagates handler error", async () => {
  const handler = { execute: async () => { throw new Error("DB error"); } };
  await assert.rejects(new UpdateCollectionService(handler).execute(command), /DB error/);
});
