import { Router, type NextFunction, type Request, type Response } from "express";
import type { CreateCollectionCommand } from "../../application/cqrs/contracts/commands/create-collection.command";
import type { UpdateCollectionCommand } from "../../application/cqrs/contracts/commands/update-collection.command";
import type { Container } from "../../infrastructure/di/container";
import { requireRole } from "../middlewares/authentication";

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value === "true";
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateCollectionPayload(
  body: Partial<CreateCollectionCommand>
): { errors: string[]; normalized: CreateCollectionCommand | null } {
  const errors: string[] = [];
  const requiredFields: Array<keyof CreateCollectionCommand> = [
    "slug",
    "name",
    "colorHex",
    "coverImageUrl",
    "description",
    "isActive",
    "displayOrder"
  ];

  requiredFields.forEach((field) => {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      errors.push(`Field '${field}' is required`);
    }
  });

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    errors.push("Field 'isActive' must be boolean");
  }

  if (body.displayOrder !== undefined && typeof body.displayOrder !== "number") {
    errors.push("Field 'displayOrder' must be number");
  }

  if (errors.length > 0) {
    return { errors, normalized: null };
  }

  return {
    errors: [],
    normalized: {
      slug: body.slug as string,
      name: body.name as string,
      colorHex: body.colorHex as string,
      coverImageUrl: body.coverImageUrl as string,
      description: body.description as string,
      isActive: body.isActive as boolean,
      displayOrder: parseNumber(body.displayOrder, 100)
    }
  };
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
        res.status(404).json({
          code: "NOT_FOUND",
          message: "Collection not found",
          details: []
        });
        return;
      }
      res.json(found);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { errors, normalized } = validateCollectionPayload(
        req.body as Partial<CreateCollectionCommand>
      );
      if (errors.length || !normalized) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: errors
        });
        return;
      }

      const created = await container.createCollectionService.execute(normalized);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requireRole("Admin"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { errors, normalized } = validateCollectionPayload(
        req.body as Partial<CreateCollectionCommand>
      );
      if (errors.length || !normalized) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: errors
        });
        return;
      }

      const payload: UpdateCollectionCommand = {
        id: req.params.id,
        ...normalized
      };

      const updated = await container.updateCollectionService.execute(payload);
      if (!updated) {
        res.status(404).json({
          code: "NOT_FOUND",
          message: "Collection not found",
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
