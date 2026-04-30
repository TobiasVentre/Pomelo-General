import assert from "node:assert/strict";
import test from "node:test";
import { Product } from "../../src/domain/entities/product";

const baseData = {
  slug: "remera", sku: "REM-001", name: "Remera", category: "Remeras",
  collection: "Azul", priceArs: 45000, description: "Desc", subtitle: "Sub",
  rating: 4, shippingInfo: "Envio", fabricCare: "Algodon", isActive: true,
  availableColors: [{ name: "Azul", hex: "#2f4f77" }],
  availableSizes: ["S", "M"],
  images: ["https://example.com/1.jpg"]
};

// --- create invariants ---

test("Product.create generates an id", () => {
  const p = Product.create(baseData);
  assert.ok(p.id.length > 0);
});

test("Product.create throws when priceArs <= 0", () => {
  assert.throws(() => Product.create({ ...baseData, priceArs: 0 }), /priceArs/);
  assert.throws(() => Product.create({ ...baseData, priceArs: -1 }), /priceArs/);
});

test("Product.create throws when rating out of range", () => {
  assert.throws(() => Product.create({ ...baseData, rating: -1 }), /rating/);
  assert.throws(() => Product.create({ ...baseData, rating: 6 }), /rating/);
});

test("Product.create throws when availableSizes has duplicates", () => {
  assert.throws(() => Product.create({ ...baseData, availableSizes: ["S", "S"] }), /duplicates/);
});

// --- reconstitute (no validation) ---

test("Product.reconstitute accepts any data without validation", () => {
  const p = Product.reconstitute({ id: "x", ...baseData, priceArs: 0 });
  assert.equal(p.priceArs, 0);
});

// --- mutation methods ---

test("Product.changePrice updates priceArs", () => {
  const p = Product.create(baseData);
  p.changePrice(60000);
  assert.equal(p.priceArs, 60000);
});

test("Product.changePrice throws when price <= 0", () => {
  const p = Product.create(baseData);
  assert.throws(() => p.changePrice(0), /priceArs/);
});

test("Product.deactivate sets isActive to false", () => {
  const p = Product.create(baseData);
  p.deactivate();
  assert.equal(p.isActive, false);
});

test("Product.activate sets isActive to true", () => {
  const p = Product.reconstitute({ id: "x", ...baseData, isActive: false });
  p.activate();
  assert.equal(p.isActive, true);
});

test("Product.replaceVariants updates colors/sizes/images", () => {
  const p = Product.create(baseData);
  p.replaceVariants([{ name: "Rojo", hex: "#f00" }], ["XL"], ["https://example.com/2.jpg"]);
  assert.equal(p.availableColors[0].name, "Rojo");
  assert.deepEqual(p.availableSizes, ["XL"]);
});

test("Product.replaceVariants throws when sizes have duplicates", () => {
  const p = Product.create(baseData);
  assert.throws(() => p.replaceVariants([], ["S", "S"], []), /duplicates/);
});
