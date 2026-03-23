import mysql, { type Pool } from "mysql2/promise";

export interface MysqlConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class MysqlClient {
  private readonly pool: Pool;

  constructor(config: MysqlConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10
    });
  }

  getPool(): Pool {
    return this.pool;
  }
}
