import assert from "node:assert/strict";
import test from "node:test";
import { CreateProductService } from "../../../src/application/services/create-product.service";
import { Product } from "../../../src/domain/entities/product";
import type { CreateProductCommand } from "../../../src/application/cqrs/contracts/commands/create-product.command";

const command: CreateProductCommand = {
  slug: "remera-test", sku: "REM-001", name: "Remera", category: "Remeras",
  collection: "Azul", priceArs: 45000, description: "Desc", subtitle: "Sub",
  rating: 4, shippingInfo: "Envio", fabricCare: "Algodon", isActive: true
};

const product = Product.reconstitute({
  id: "uuid-1", ...command,
  availableColors: [], availableSizes: [], images: []
});

test("CreateProductService delegates to handler and returns result", async () => {
  const handler = { execute: async () => product };
  const service = new CreateProductService(handler);
  const result = await service.execute(command);
  assert.deepEqual(result, product);
});

test("CreateProductService propagates handler error", async () => {
  const handler = { execute: async () => { throw new Error("DB error"); } };
  const service = new CreateProductService(handler);
  await assert.rejects(service.execute(command), /DB error/);
});
