import assert from "node:assert/strict";
import test from "node:test";
import { MysqlUnitOfWork } from "../../../src/infrastructure/persistence/mysql/mysql-unit-of-work";
import { createMockConnection } from "../helpers/mock-mysql-client";

function makeClient(conn: ReturnType<typeof createMockConnection>) {
  return { getPool: () => ({ getConnection: async () => conn }) };
}

test("MysqlUnitOfWork commits when fn resolves", async () => {
  let committed = false;
  const conn = createMockConnection({ commit: async () => { committed = true; } });
  const uow = new MysqlUnitOfWork(makeClient(conn) as never);
  const result = await uow.withTransaction(async () => 42);
  assert.equal(result, 42);
  assert.ok(committed, "commit should be called");
});

test("MysqlUnitOfWork rolls back and rethrows when fn rejects", async () => {
  let rolledBack = false;
  let committed = false;
  const conn = createMockConnection({
    rollback: async () => { rolledBack = true; },
    commit: async () => { committed = true; }
  });
  const uow = new MysqlUnitOfWork(makeClient(conn) as never);
  await assert.rejects(
    uow.withTransaction(async () => { throw new Error("fn failed"); }),
    /fn failed/
  );
  assert.ok(rolledBack, "rollback should be called");
  assert.equal(committed, false, "commit should NOT be called");
});

test("MysqlUnitOfWork releases connection even on error", async () => {
  let released = false;
  const conn = createMockConnection({ release: () => { released = true; } });
  const uow = new MysqlUnitOfWork(makeClient(conn) as never);
  await uow.withTransaction(async () => "ok");
  assert.ok(released, "connection should be released");
});
