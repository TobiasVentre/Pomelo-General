import assert from "node:assert/strict";
import test from "node:test";
import { validateProductPayload } from "./products.routes";

test("validateProductPayload should accept valid payload", () => {
  const result = validateProductPayload({
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
  });

  assert.equal(result.errors.length, 0);
  assert.ok(result.normalized);
});

test("validateProductPayload should reject missing required fields", () => {
  const result = validateProductPayload({
    slug: "remera-test"
  });

  assert.ok(result.errors.length > 0);
  assert.equal(result.normalized, null);
});
