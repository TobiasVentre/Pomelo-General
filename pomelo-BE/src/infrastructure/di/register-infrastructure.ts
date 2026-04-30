import type { env } from "../config/env";
import { logger } from "../logging/logger";

type Env = typeof env;
import { CreateCollectionCommandMysqlImpl } from "../commands/create-collection.command-impl";
import { CreateProductCommandMysqlImpl } from "../commands/create-product.command-impl";
import { UpdateCollectionCommandMysqlImpl } from "../commands/update-collection.command-impl";
import { UpdateProductCommandMysqlImpl } from "../commands/update-product.command-impl";
import { MysqlClient } from "../persistence/mysql/mysql-client";
import { GetCollectionsQueryMysqlImpl } from "../queries/get-collections.query-impl";
import { GetProductsQueryMysqlImpl } from "../queries/get-products.query-impl";
import { OcaShippingProvider } from "../shipping/oca-shipping-provider";
import { MysqlUnitOfWork } from "../persistence/mysql/mysql-unit-of-work";

export interface InfrastructureDeps {
  mysqlClient: MysqlClient;
  unitOfWork: MysqlUnitOfWork;
  createCollectionCommand: CreateCollectionCommandMysqlImpl;
  updateCollectionCommand: UpdateCollectionCommandMysqlImpl;
  getCollectionsQuery: GetCollectionsQueryMysqlImpl;
  getProductsQuery: GetProductsQueryMysqlImpl;
  createProductCommand: CreateProductCommandMysqlImpl;
  updateProductCommand: UpdateProductCommandMysqlImpl;
  shippingProvider: OcaShippingProvider;
}

export function registerInfrastructure(env: Env): InfrastructureDeps {
  const mysqlClient = new MysqlClient({
    host: env.mysqlHost,
    port: env.mysqlPort,
    database: env.mysqlDatabase,
    user: env.mysqlUser,
    password: env.mysqlPassword
  });

  const shippingProvider = new OcaShippingProvider({
    apiBaseUrl: env.ocaApiBaseUrl,
    loginPath: env.ocaLoginPath,
    createShipmentPath: env.ocaCreateShipmentPath,
    trackCurrentStatusPath: env.ocaTrackCurrentStatusPath,
    trackHistoryPath: env.ocaTrackHistoryPath,
    client: env.ocaClient,
    user: env.ocaUser,
    password: env.ocaPassword,
    productCode: env.ocaProductCode,
    logger
  });

  return {
    mysqlClient,
    unitOfWork: new MysqlUnitOfWork(mysqlClient),
    createCollectionCommand: new CreateCollectionCommandMysqlImpl(mysqlClient),
    updateCollectionCommand: new UpdateCollectionCommandMysqlImpl(mysqlClient),
    getCollectionsQuery: new GetCollectionsQueryMysqlImpl(mysqlClient),
    getProductsQuery: new GetProductsQueryMysqlImpl(mysqlClient),
    createProductCommand: new CreateProductCommandMysqlImpl(mysqlClient),
    updateProductCommand: new UpdateProductCommandMysqlImpl(mysqlClient),
    shippingProvider
  };
}
