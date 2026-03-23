import { Router } from "express";

export function buildHealthRoutes(): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });
  return router;
}
