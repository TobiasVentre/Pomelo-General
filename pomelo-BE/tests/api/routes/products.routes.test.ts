import assert from "node:assert/strict";
import test from "node:test";
import { buildProductsRoutes } from "../../../src/api/routes/products.routes";

test("buildProductsRoutes should return an Express router", () => {
  const fakeContainer = {} as Parameters<typeof buildProductsRoutes>[0];
  const router = buildProductsRoutes(fakeContainer);
  assert.ok(router, "router should be defined");
  assert.equal(typeof router, "function");
});
