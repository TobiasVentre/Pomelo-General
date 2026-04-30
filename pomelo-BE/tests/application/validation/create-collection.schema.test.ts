import assert from "node:assert/strict";
import test from "node:test";
import { CreateCollectionSchema } from "../../../src/application/validation/create-collection.schema";

const validPayload = {
  slug: "azul",
  name: "Azul",
  colorHex: "#2f4f77",
  coverImageUrl: "https://example.com/azul.jpg",
  description: "Coleccion azul",
  isActive: true,
  displayOrder: 1
};

test("CreateCollectionSchema should accept valid payload", () => {
  const result = CreateCollectionSchema.parse(validPayload);
  assert.equal(result.slug, "azul");
  assert.equal(result.isActive, true);
});

test("CreateCollectionSchema should reject missing required fields", () => {
  assert.throws(() => CreateCollectionSchema.parse({ slug: "azul" }));
});

test("CreateCollectionSchema should reject invalid coverImageUrl", () => {
  assert.throws(() =>
    CreateCollectionSchema.parse({ ...validPayload, coverImageUrl: "not-a-url" })
  );
});

test("CreateCollectionSchema should reject non-integer displayOrder", () => {
  assert.throws(() =>
    CreateCollectionSchema.parse({ ...validPayload, displayOrder: 1.5 })
  );
});
