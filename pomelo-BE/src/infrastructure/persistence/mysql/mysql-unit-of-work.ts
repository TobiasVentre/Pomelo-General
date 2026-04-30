import type { IUnitOfWork } from "../../../application/contracts/unit-of-work";
import type { MysqlClient } from "./mysql-client";

export class MysqlUnitOfWork implements IUnitOfWork {
  constructor(private readonly mysqlClient: MysqlClient) {}

  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const connection = await this.mysqlClient.getPool().getConnection();
    try {
      await connection.beginTransaction();
      const result = await fn();
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
