import { Router, type NextFunction, type Request, type Response } from "express";
import { CreateShipmentSchema } from "../../application/validation/create-shipment.schema";
import { QuoteShippingSchema } from "../../application/validation/quote-shipping.schema";
import type { Container } from "../../infrastructure/di/container";

export function buildShippingRoutes(container: Container): Router {
  const router = Router();

  router.post("/quote", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = QuoteShippingSchema.parse(req.body);
      const quote = await container.quoteShippingService.execute(input);
      res.json(quote);
    } catch (error) {
      next(error);
    }
  });

  router.post("/shipments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = CreateShipmentSchema.parse(req.body);
      const result = await container.createShipmentService.execute({
        ...body,
        productCode: body.productCode ?? container.shippingDefaults.productCode
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/shipments/:shipmentId/track",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tracking = await container.trackShipmentService.execute(req.params.shipmentId);
        res.json(tracking);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
