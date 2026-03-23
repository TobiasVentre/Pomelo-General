import { Router, type NextFunction, type Request, type Response } from "express";
import type { CreateProductCommand } from "../../application/cqrs/contracts/commands/create-product.command";
import type { UpdateProductCommand } from "../../application/cqrs/contracts/commands/update-product.command";
import type { Container } from "../../infrastructure/di/container";
import { requireRole } from "../middlewares/authentication";

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value === "true";
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateProductPayload(
  body: Partial<CreateProductCommand>
): { errors: string[]; normalized: CreateProductCommand | null } {
  const errors: string[] = [];
  const requiredFields: Array<keyof CreateProductCommand> = [
    "slug",
    "sku",
    "name",
    "category",
    "collection",
    "priceArs",
    "description",
    "subtitle",
    "rating",
    "shippingInfo",
    "fabricCare",
    "isActive"
  ];

  requiredFields.forEach((field) => {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      errors.push(`Field '${field}' is required`);
    }
  });

  if (body.priceArs !== undefined && typeof body.priceArs !== "number") {
    errors.push("Field 'priceArs' must be number");
  }
  if (body.rating !== undefined && typeof body.rating !== "number") {
    errors.push("Field 'rating' must be number");
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    errors.push("Field 'isActive' must be boolean");
  }

  if (
    body.availableSizes !== undefined &&
    !isStringArray(body.availableSizes)
  ) {
    errors.push("Field 'availableSizes' must be string[]");
  }

  if (
    body.images !== undefined &&
    !isStringArray(body.images)
  ) {
    errors.push("Field 'images' must be string[]");
  }

  if (body.availableColors !== undefined) {
    const validColors =
      Array.isArray(body.availableColors) &&
      body.availableColors.every(
        (color) =>
          typeof color === "object" &&
          color !== null &&
          typeof color.name === "string" &&
          typeof color.hex === "string"
      );
    if (!validColors) {
      errors.push("Field 'availableColors' must be array of {name, hex}");
    }
  }

  if (errors.length > 0) {
    return { errors, normalized: null };
  }

  return {
    errors: [],
    normalized: {
      slug: body.slug as string,
      sku: body.sku as string,
      name: body.name as string,
      category: body.category as string,
      collection: body.collection as string,
      priceArs: body.priceArs as number,
      description: body.description as string,
      subtitle: body.subtitle as string,
      rating: body.rating as number,
      shippingInfo: body.shippingInfo as string,
      fabricCare: body.fabricCare as string,
      isActive: body.isActive as boolean,
      availableColors: body.availableColors ?? [],
      availableSizes: body.availableSizes ?? [],
      images: body.images ?? []
    }
  };
}

export function buildProductsRoutes(container: Container): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await container.getProductsService.execute({
        collection: req.query.collection as string | undefined,
        category: req.query.category as string | undefined,
        activeOnly: parseBoolean(req.query.activeOnly as string | undefined),
        page: parseNumber(req.query.page as string | undefined, 1),
        pageSize: parseNumber(req.query.pageSize as string | undefined, 20)
      });

      res.json({ items: products, total: products.length });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await container.getProductsService.execute({
        slug: req.params.slug,
        activeOnly: true,
        page: 1,
        pageSize: 1
      });

      if (items.length === 0) {
        res.status(404).json({
          code: "NOT_FOUND",
          message: "Product not found",
          details: []
        });
        return;
      }

      res.json(items[0]);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { errors, normalized } = validateProductPayload(
        req.body as Partial<CreateProductCommand>
      );
      if (errors.length || !normalized) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: errors
        });
        return;
      }

      const created = await container.createProductService.execute(normalized);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { errors, normalized } = validateProductPayload(
        req.body as Partial<CreateProductCommand>
      );
      if (errors.length || !normalized) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: errors
        });
        return;
      }

      const payload: UpdateProductCommand = {
        id: req.params.id,
        ...normalized
      };
      const updated = await container.updateProductService.execute(payload);

      if (!updated) {
        res.status(404).json({
          code: "NOT_FOUND",
          message: "Product not found",
          details: []
        });
        return;
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
