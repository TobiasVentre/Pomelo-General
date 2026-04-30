import assert from "node:assert/strict";
import test from "node:test";
import { Collection } from "../../src/domain/entities/collection";

const baseData = {
  id: "uuid-1", slug: "azul", name: "Azul", colorHex: "#2f4f77",
  coverImageUrl: "https://example.com/azul.jpg", description: "Desc",
  isActive: true, displayOrder: 1
};

test("Collection.create throws when displayOrder < 0", () => {
  assert.throws(() => Collection.create({ ...baseData, displayOrder: -1 }), /displayOrder/);
});

test("Collection.create returns collection with all fields", () => {
  const c = Collection.create(baseData);
  assert.equal(c.slug, "azul");
  assert.equal(c.isActive, true);
});

test("Collection.deactivate sets isActive to false", () => {
  const c = Collection.create(baseData);
  c.deactivate();
  assert.equal(c.isActive, false);
});

test("Collection.activate sets isActive to true", () => {
  const c = Collection.reconstitute({ ...baseData, isActive: false });
  c.activate();
  assert.equal(c.isActive, true);
});
