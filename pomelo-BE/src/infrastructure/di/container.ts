import { CreateProductService } from "../../application/services/create-product.service";
import { CreateCollectionService } from "../../application/services/create-collection.service";
import { CreateShipmentService } from "../../application/services/create-shipment.service";
import { GetCollectionsService } from "../../application/services/get-collections.service";
import { GetProductsService } from "../../application/services/get-products.service";
import { QuoteShippingService } from "../../application/services/quote-shipping.service";
import { TrackShipmentService } from "../../application/services/track-shipment.service";
import { UpdateCollectionService } from "../../application/services/update-collection.service";
import { UpdateProductService } from "../../application/services/update-product.service";
import { CreateCollectionCommandMysqlImpl } from "../commands/create-collection.command-impl";
import { env } from "../config/env";
import { CreateProductCommandMysqlImpl } from "../commands/create-product.command-impl";
import { UpdateCollectionCommandMysqlImpl } from "../commands/update-collection.command-impl";
import { UpdateProductCommandMysqlImpl } from "../commands/update-product.command-impl";
import { MysqlClient } from "../persistence/mysql/mysql-client";
import { GetCollectionsQueryMysqlImpl } from "../queries/get-collections.query-impl";
import { GetProductsQueryMysqlImpl } from "../queries/get-products.query-impl";
import { OcaShippingProvider } from "../shipping/oca-shipping-provider";

export interface Container {
  createCollectionService: CreateCollectionService;
  updateCollectionService: UpdateCollectionService;
  getCollectionsService: GetCollectionsService;
  getProductsService: GetProductsService;
  createProductService: CreateProductService;
  updateProductService: UpdateProductService;
  quoteShippingService: QuoteShippingService;
  createShipmentService: CreateShipmentService;
  trackShipmentService: TrackShipmentService;
  shippingDefaults: {
    productCode: string;
  };
}

export function buildContainer(): Container {
  const mysqlClient = new MysqlClient({
    host: env.mysqlHost,
    port: env.mysqlPort,
    database: env.mysqlDatabase,
    user: env.mysqlUser,
    password: env.mysqlPassword
  });

  const createCollectionCommand = new CreateCollectionCommandMysqlImpl(mysqlClient);
  const updateCollectionCommand = new UpdateCollectionCommandMysqlImpl(mysqlClient);
  const getCollectionsQuery = new GetCollectionsQueryMysqlImpl(mysqlClient);
  const getProductsQuery = new GetProductsQueryMysqlImpl(mysqlClient);
  const createProductCommand = new CreateProductCommandMysqlImpl(mysqlClient);
  const updateProductCommand = new UpdateProductCommandMysqlImpl(mysqlClient);
  const shippingProvider = new OcaShippingProvider({
    apiBaseUrl: env.ocaApiBaseUrl,
    loginPath: env.ocaLoginPath,
    createShipmentPath: env.ocaCreateShipmentPath,
    trackCurrentStatusPath: env.ocaTrackCurrentStatusPath,
    trackHistoryPath: env.ocaTrackHistoryPath,
    client: env.ocaClient,
    user: env.ocaUser,
    password: env.ocaPassword,
    productCode: env.ocaProductCode
  });

  return {
    createCollectionService: new CreateCollectionService(createCollectionCommand),
    updateCollectionService: new UpdateCollectionService(updateCollectionCommand),
    getCollectionsService: new GetCollectionsService(getCollectionsQuery),
    getProductsService: new GetProductsService(getProductsQuery),
    createProductService: new CreateProductService(createProductCommand),
    updateProductService: new UpdateProductService(updateProductCommand),
    quoteShippingService: new QuoteShippingService(shippingProvider),
    createShipmentService: new CreateShipmentService(shippingProvider),
    trackShipmentService: new TrackShipmentService(shippingProvider),
    shippingDefaults: {
      productCode: env.ocaProductCode
    }
  };
}
