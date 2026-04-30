import assert from "node:assert/strict";
import test from "node:test";
import { GetProductsService } from "../../../src/application/services/get-products.service";
import { Product } from "../../../src/domain/entities/product";

const product = Product.reconstitute({
  id: "uuid-1", slug: "remera", sku: "REM-001", name: "Remera", category: "Remeras",
  collection: "Azul", priceArs: 45000, description: "Desc", subtitle: "Sub",
  rating: 4, shippingInfo: "Envio", fabricCare: "Algodon", isActive: true,
  availableColors: [], availableSizes: [], images: []
});

test("GetProductsService returns products from handler", async () => {
  const handler = { execute: async () => [product] };
  const result = await new GetProductsService(handler).execute({ page: 1, pageSize: 10 });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "uuid-1");
});

test("GetProductsService returns empty array when handler returns none", async () => {
  const handler = { execute: async () => [] };
  const result = await new GetProductsService(handler).execute({ page: 1, pageSize: 10 });
  assert.deepEqual(result, []);
});

test("GetProductsService propagates handler error", async () => {
  const handler = { execute: async () => { throw new Error("DB error"); } };
  await assert.rejects(new GetProductsService(handler).execute({ page: 1, pageSize: 10 }), /DB error/);
});
