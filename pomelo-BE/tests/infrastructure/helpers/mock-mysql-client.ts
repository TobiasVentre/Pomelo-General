type QueryResult = unknown[];

export interface MockConnection {
  executedQueries: Array<{ sql: string; params: unknown[] }>;
  beginTransaction(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<[unknown[], unknown[]]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
  _shouldFailOnCommit?: boolean;
}

export function createMockConnection(overrides?: Partial<MockConnection>): MockConnection {
  const conn: MockConnection = {
    executedQueries: [],
    beginTransaction: async () => {},
    execute: async (sql, params = []) => {
      conn.executedQueries.push({ sql, params });
      return [[], []];
    },
    commit: async () => {
      if (conn._shouldFailOnCommit) throw new Error("Commit failed");
    },
    rollback: async () => {},
    release: () => {},
    ...overrides
  };
  return conn;
}

export function createMockPool(queryRows: QueryResult[] = []) {
  let callIndex = 0;
  return {
    query: async () => [queryRows[callIndex++] ?? [], []],
    execute: async () => [[], []],
    getConnection: async () => createMockConnection()
  };
}

export function createMockMysqlClient(pool: ReturnType<typeof createMockPool>) {
  return { getPool: () => pool };
}
