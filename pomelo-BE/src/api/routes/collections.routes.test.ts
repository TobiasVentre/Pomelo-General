import assert from "node:assert/strict";
import test from "node:test";
import { validateCollectionPayload } from "./collections.routes";

test("validateCollectionPayload should accept valid payload", () => {
  const result = validateCollectionPayload({
    slug: "azul",
    name: "Azul",
    colorHex: "#2f4f77",
    coverImageUrl: "https://example.com/azul.jpg",
    description: "Coleccion azul",
    isActive: true,
    displayOrder: 1
  });

  assert.equal(result.errors.length, 0);
  assert.ok(result.normalized);
});

test("validateCollectionPayload should reject invalid payload", () => {
  const result = validateCollectionPayload({
    slug: "azul"
  });

  assert.ok(result.errors.length > 0);
  assert.equal(result.normalized, null);
});
