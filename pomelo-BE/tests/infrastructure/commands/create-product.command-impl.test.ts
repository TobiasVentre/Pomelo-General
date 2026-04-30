import assert from "node:assert/strict";
import test from "node:test";
import { CreateProductCommandMysqlImpl } from "../../../src/infrastructure/commands/create-product.command-impl";
import { createMockConnection } from "../helpers/mock-mysql-client";
import type { CreateProductCommand } from "../../../src/application/cqrs/contracts/commands/create-product.command";

const command: CreateProductCommand = {
  slug: "remera", sku: "REM-001", name: "Remera", category: "Remeras",
  collection: "Azul", priceArs: 45000, description: "Desc", subtitle: "Sub",
  rating: 4, shippingInfo: "Envio", fabricCare: "Algodon", isActive: true,
  availableColors: [{ name: "Azul", hex: "#2f4f77" }],
  availableSizes: ["S", "M"],
  images: ["https://example.com/img.jpg"]
};

test("CreateProductCommandMysqlImpl returns product with generated id", async () => {
  const conn = createMockConnection();
  const mockClient = { getPool: () => ({ getConnection: async () => conn }) };
  const impl = new CreateProductCommandMysqlImpl(mockClient as never);
  const product = await impl.execute(command);
  assert.ok(product.id, "should have id");
  assert.equal(product.slug, command.slug);
  assert.equal(product.priceArs, command.priceArs);
  assert.deepEqual(product.availableSizes, ["S", "M"]);
});

test("CreateProductCommandMysqlImpl calls beginTransaction and commit", async () => {
  let began = false;
  let committed = false;
  const conn = createMockConnection({
    beginTransaction: async () => { began = true; },
    commit: async () => { committed = true; }
  });
  const mockClient = { getPool: () => ({ getConnection: async () => conn }) };
  await new CreateProductCommandMysqlImpl(mockClient as never).execute(command);
  assert.ok(began, "beginTransaction should be called");
  assert.ok(committed, "commit should be called");
});

test("CreateProductCommandMysqlImpl rolls back and rethrows on error", async () => {
  let rolledBack = false;
  const conn = createMockConnection({
    execute: async (sql) => {
      if (sql.includes("INSERT INTO products")) throw new Error("DB constraint");
      return [[], []];
    },
    rollback: async () => { rolledBack = true; }
  });
  const mockClient = { getPool: () => ({ getConnection: async () => conn }) };
  await assert.rejects(
    new CreateProductCommandMysqlImpl(mockClient as never).execute(command),
    /DB constraint/
  );
  assert.ok(rolledBack, "rollback should be called on error");
});
