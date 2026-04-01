import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";

const mimeTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"]
]);

function normalizePathSegments(value: string | string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((segment) => segment.length > 0);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }

  const requestedSegments = normalizePathSegments(req.query.path);
  if (requestedSegments.length === 0) {
    res.status(404).end();
    return;
  }

  if (requestedSegments.some((segment) => segment.includes("..") || path.isAbsolute(segment))) {
    res.status(400).json({ message: "Ruta invalida" });
    return;
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const resolvedPath = path.resolve(uploadsRoot, ...requestedSegments);

  if (!resolvedPath.startsWith(`${uploadsRoot}${path.sep}`) && resolvedPath !== uploadsRoot) {
    res.status(403).json({ message: "Ruta no permitida" });
    return;
  }

  try {
    const fileBuffer = await readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();
    const contentType = mimeTypes.get(extension) ?? "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).send(fileBuffer);
  } catch {
    res.status(404).end();
  }
}
