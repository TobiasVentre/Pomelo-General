import { Router, type NextFunction, type Request, type Response } from "express";
import { CreateCollectionSchema } from "../../application/validation/create-collection.schema";
import { NotFoundError } from "../../application/errors/not-found-error";
import type { Container } from "../../infrastructure/di/container";
import { requireRole } from "../middlewares/authentication";

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value === "true";
}

export function buildCollectionsRoutes(container: Container): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await container.getCollectionsService.execute({
        activeOnly: parseBoolean(req.query.activeOnly as string | undefined)
      });
      res.json({ items, total: items.length });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await container.getCollectionsService.execute({
        slug: req.params.slug,
        activeOnly: true
      });
      const found = items[0];
      if (!found) {
        throw new NotFoundError("Collection", req.params.slug);
      }
      res.json(found);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = CreateCollectionSchema.parse(req.body);
      const created = await container.createCollectionService.execute(command);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = CreateCollectionSchema.parse(req.body);
      const updated = await container.updateCollectionService.execute({
        id: req.params.id,
        ...body
      });
      if (!updated) {
        throw new NotFoundError("Collection", req.params.id);
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
