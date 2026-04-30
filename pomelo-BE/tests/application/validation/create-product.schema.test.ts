import assert from "node:assert/strict";
import test from "node:test";
import { CreateProductSchema } from "../../../src/application/validation/create-product.schema";

const validPayload = {
  slug: "remera-test",
  sku: "REM-001",
  name: "Remera Test",
  category: "Remeras",
  collection: "Azul",
  priceArs: 45000,
  description: "Desc",
  subtitle: "Sub",
  rating: 4,
  shippingInfo: "Envio",
  fabricCare: "Algodon",
  isActive: true,
  availableColors: [{ name: "Azul", hex: "#2f4f77" }],
  availableSizes: ["S", "M"],
  images: ["https://example.com/1.jpg"]
};

test("CreateProductSchema should accept valid payload", () => {
  const result = CreateProductSchema.parse(validPayload);
  assert.equal(result.slug, "remera-test");
  assert.equal(result.priceArs, 45000);
  assert.deepEqual(result.availableSizes, ["S", "M"]);
});

test("CreateProductSchema should default optional arrays to []", () => {
  const { availableColors, availableSizes, images, ...minimal } = validPayload;
  const result = CreateProductSchema.parse(minimal);
  assert.deepEqual(result.availableColors, []);
  assert.deepEqual(result.availableSizes, []);
  assert.deepEqual(result.images, []);
});

test("CreateProductSchema should reject missing required fields", () => {
  assert.throws(() => CreateProductSchema.parse({ slug: "only-slug" }), /invalid/i);
});

test("CreateProductSchema should reject non-positive priceArs", () => {
  assert.throws(() => CreateProductSchema.parse({ ...validPayload, priceArs: 0 }));
  assert.throws(() => CreateProductSchema.parse({ ...validPayload, priceArs: -100 }));
});

test("CreateProductSchema should reject invalid color shape", () => {
  assert.throws(() =>
    CreateProductSchema.parse({ ...validPayload, availableColors: [{ name: "Azul" }] })
  );
});
