import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainError } from "../../application/errors/domain-error";
import { ValidationError } from "../../application/errors/validation-error";
import { logger } from "../../infrastructure/logging/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`);
    const validationError = new ValidationError("Invalid request body", details);
    res.status(validationError.httpStatus).json(validationError.toProblemDetails(req.path));
    return;
  }

  if (err instanceof DomainError) {
    res.status(err.httpStatus).json(err.toProblemDetails(req.path));
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  logger.error("Unhandled error", { path: req.path, message });
  res.status(500).json({
    type: "https://pomelo.ar/errors/internal-error",
    title: "INTERNAL_ERROR",
    status: 500,
    detail: message,
    instance: req.path
  });
}
