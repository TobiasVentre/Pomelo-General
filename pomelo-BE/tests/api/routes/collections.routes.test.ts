import assert from "node:assert/strict";
import test from "node:test";
import { buildCollectionsRoutes } from "../../../src/api/routes/collections.routes";

test("buildCollectionsRoutes should return an Express router", () => {
  const fakeContainer = {} as Parameters<typeof buildCollectionsRoutes>[0];
  const router = buildCollectionsRoutes(fakeContainer);
  assert.ok(router, "router should be defined");
  assert.equal(typeof router, "function");
});
