import assert from "node:assert/strict";
import test from "node:test";
import { UpdateProductService } from "../../../src/application/services/update-product.service";
import { Product } from "../../../src/domain/entities/product";
import type { UpdateProductCommand } from "../../../src/application/cqrs/contracts/commands/update-product.command";

const command: UpdateProductCommand = {
  id: "uuid-1", slug: "remera-test", sku: "REM-001", name: "Remera",
  category: "Remeras", collection: "Azul", priceArs: 45000, description: "Desc",
  subtitle: "Sub", rating: 4, shippingInfo: "Envio", fabricCare: "Algodon", isActive: true
};

const product = Product.reconstitute({
  ...command,
  availableColors: [], availableSizes: [], images: []
});

test("UpdateProductService returns updated product", async () => {
  const handler = { execute: async () => product };
  const result = await new UpdateProductService(handler).execute(command);
  assert.deepEqual(result, product);
});

test("UpdateProductService returns null when not found", async () => {
  const handler = { execute: async () => null };
  const result = await new UpdateProductService(handler).execute(command);
  assert.equal(result, null);
});

test("UpdateProductService propagates handler error", async () => {
  const handler = { execute: async () => { throw new Error("DB error"); } };
  await assert.rejects(new UpdateProductService(handler).execute(command), /DB error/);
});
