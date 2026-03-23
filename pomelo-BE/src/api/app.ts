import express from "express";
import swaggerUi from "swagger-ui-express";
import { buildContainer } from "../infrastructure/di/container";
import { openApiSpec } from "./docs/openapi";
import { buildCollectionsRoutes } from "./routes/collections.routes";
import { buildHealthRoutes } from "./routes/health.routes";
import { buildProductsRoutes } from "./routes/products.routes";
import { buildShippingRoutes } from "./routes/shipping.routes";
import { errorHandler } from "./middlewares/error-handler";

export function buildApp(): express.Express {
  const app = express();
  const container = buildContainer();

  app.use(express.json());
  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use("/api/health", buildHealthRoutes());
  app.use("/api/collections", buildCollectionsRoutes(container));
  app.use("/api/products", buildProductsRoutes(container));
  app.use("/api/shipping", buildShippingRoutes(container));

  app.use(errorHandler);

  return app;
}
