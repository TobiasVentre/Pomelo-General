import { CreateCollectionService } from "../services/create-collection.service";
import { CreateProductService } from "../services/create-product.service";
import { CreateShipmentService } from "../services/create-shipment.service";
import { GetCollectionsService } from "../services/get-collections.service";
import { GetProductsService } from "../services/get-products.service";
import { QuoteShippingService } from "../services/quote-shipping.service";
import { TrackShipmentService } from "../services/track-shipment.service";
import { UpdateCollectionService } from "../services/update-collection.service";
import { UpdateProductService } from "../services/update-product.service";
import type { InfrastructureDeps } from "../../infrastructure/di/register-infrastructure";

export interface ApplicationDeps {
  createCollectionService: CreateCollectionService;
  updateCollectionService: UpdateCollectionService;
  getCollectionsService: GetCollectionsService;
  getProductsService: GetProductsService;
  createProductService: CreateProductService;
  updateProductService: UpdateProductService;
  quoteShippingService: QuoteShippingService;
  createShipmentService: CreateShipmentService;
  trackShipmentService: TrackShipmentService;
  shippingDefaults: { productCode: string };
}

export function registerApplication(
  infra: InfrastructureDeps,
  shippingProductCode: string
): ApplicationDeps {
  return {
    createCollectionService: new CreateCollectionService(infra.createCollectionCommand),
    updateCollectionService: new UpdateCollectionService(infra.updateCollectionCommand),
    getCollectionsService: new GetCollectionsService(infra.getCollectionsQuery),
    getProductsService: new GetProductsService(infra.getProductsQuery),
    createProductService: new CreateProductService(infra.createProductCommand),
    updateProductService: new UpdateProductService(infra.updateProductCommand),
    quoteShippingService: new QuoteShippingService(infra.shippingProvider),
    createShipmentService: new CreateShipmentService(infra.shippingProvider),
    trackShipmentService: new TrackShipmentService(infra.shippingProvider),
    shippingDefaults: { productCode: shippingProductCode }
  };
}
