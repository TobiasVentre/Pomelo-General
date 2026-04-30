import assert from "node:assert/strict";
import test from "node:test";
import { CreateCollectionService } from "../../../src/application/services/create-collection.service";
import { Collection } from "../../../src/domain/entities/collection";
import type { CreateCollectionCommand } from "../../../src/application/cqrs/contracts/commands/create-collection.command";

const command: CreateCollectionCommand = {
  slug: "azul", name: "Azul", colorHex: "#2f4f77",
  coverImageUrl: "https://example.com/azul.jpg", description: "Desc",
  isActive: true, displayOrder: 1
};

const collection = Collection.reconstitute({ id: "uuid-1", ...command });

test("CreateCollectionService delegates to handler and returns result", async () => {
  const handler = { execute: async () => collection };
  const result = await new CreateCollectionService(handler).execute(command);
  assert.deepEqual(result, collection);
});

test("CreateCollectionService propagates handler error", async () => {
  const handler = { execute: async () => { throw new Error("DB error"); } };
  await assert.rejects(new CreateCollectionService(handler).execute(command), /DB error/);
});
