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
    variants: [
      {
        fabricColor: { name: "Azul", hex: "#2f4f77" },
        printColor: { name: "Blanco", hex: "#ffffff" },
        images: ["https://example.com/1.jpg"]
      }
    ],
    availableSizes: ["S", "M"],
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

test("validateProductPayload should reject duplicated variants", () => {
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
    variants: [
      {
        fabricColor: { name: "Azul", hex: "#2f4f77" },
        printColor: { name: "Blanco", hex: "#ffffff" },
        images: ["https://example.com/1.jpg"]
      },
      {
        fabricColor: { name: "Azul", hex: "#2f4f77" },
        printColor: { name: "Blanco", hex: "#ffffff" },
        images: ["https://example.com/2.jpg"]
      }
    ]
  });

  assert.ok(result.errors.some((error) => error.includes("duplicated tela + estampa")));
  assert.equal(result.normalized, null);
});
