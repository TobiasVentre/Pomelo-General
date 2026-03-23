import { Router, type NextFunction, type Request, type Response } from "express";
import type { Container } from "../../infrastructure/di/container";
import type { CreateShipmentInput } from "../../application/contracts/gateways/shipping-provider";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildShippingRoutes(container: Container): Router {
  const router = Router();

  router.post("/quote", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postalCode, itemsCount, subtotalArs } = req.body as {
        postalCode?: string;
        itemsCount?: number;
        subtotalArs?: number;
      };

      const errors: string[] = [];
      if (!isNonEmptyString(postalCode)) {
        errors.push("Field 'postalCode' is required");
      }
      if (typeof itemsCount !== "number" || itemsCount <= 0) {
        errors.push("Field 'itemsCount' must be number > 0");
      }
      if (typeof subtotalArs !== "number" || subtotalArs < 0) {
        errors.push("Field 'subtotalArs' must be number >= 0");
      }

      if (errors.length > 0) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: errors
        });
        return;
      }

      const quote = await container.quoteShippingService.execute({
        postalCode: postalCode!,
        itemsCount: itemsCount!,
        subtotalArs: subtotalArs!
      });

      res.json(quote);
    } catch (error) {
      next(error);
    }
  });

  router.post("/shipments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Partial<CreateShipmentInput>;
      const requiredStringFields: Array<keyof CreateShipmentInput> = [
        "orderId",
        "recipientName",
        "recipientEmail",
        "recipientPhone",
        "recipientAddress",
        "recipientCity",
        "recipientProvince",
        "recipientPostalCode",
        "itemsDescription"
      ];

      const errors: string[] = [];
      requiredStringFields.forEach((field) => {
        if (!isNonEmptyString(body[field])) {
          errors.push(`Field '${field}' is required`);
        }
      });

      if (
        typeof body.packageWeightKg !== "number" ||
        body.packageWeightKg <= 0
      ) {
        errors.push("Field 'packageWeightKg' must be number > 0");
      }
      if (
        typeof body.packageVolumeCm3 !== "number" ||
        body.packageVolumeCm3 <= 0
      ) {
        errors.push("Field 'packageVolumeCm3' must be number > 0");
      }
      if (
        typeof body.declaredValueArs !== "number" ||
        body.declaredValueArs < 0
      ) {
        errors.push("Field 'declaredValueArs' must be number >= 0");
      }

      if (errors.length > 0) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: errors
        });
        return;
      }

      const result = await container.createShipmentService.execute({
        orderId: body.orderId!,
        productCode: body.productCode ?? container.shippingDefaults.productCode,
        recipientName: body.recipientName!,
        recipientEmail: body.recipientEmail!,
        recipientPhone: body.recipientPhone!,
        recipientAddress: body.recipientAddress!,
        recipientCity: body.recipientCity!,
        recipientProvince: body.recipientProvince!,
        recipientPostalCode: body.recipientPostalCode!,
        packageWeightKg: body.packageWeightKg!,
        packageVolumeCm3: body.packageVolumeCm3!,
        declaredValueArs: body.declaredValueArs!,
        itemsDescription: body.itemsDescription!
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
        if (!isNonEmptyString(req.params.shipmentId)) {
          res.status(400).json({
            code: "VALIDATION_ERROR",
            message: "Invalid shipment id",
            details: ["Field 'shipmentId' is required"]
          });
          return;
        }

        const tracking = await container.trackShipmentService.execute(req.params.shipmentId);
        res.json(tracking);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
