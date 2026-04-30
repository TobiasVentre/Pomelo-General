import { Router, type NextFunction, type Request, type Response } from "express";
import { CreateProductSchema } from "../../application/validation/create-product.schema";
import { NotFoundError } from "../../application/errors/not-found-error";
import type { Container } from "../../infrastructure/di/container";
import { requireRole } from "../middlewares/authentication";

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value === "true";
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
        throw new NotFoundError("Product", req.params.slug);
      }
      res.json(items[0]);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = CreateProductSchema.parse(req.body);
      const created = await container.createProductService.execute(command);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = CreateProductSchema.parse(req.body);
      const updated = await container.updateProductService.execute({
        id: req.params.id,
        ...body
      });
      if (!updated) {
        throw new NotFoundError("Product", req.params.id);
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
