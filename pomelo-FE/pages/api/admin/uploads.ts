import { randomUUID } from "node:crypto";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type Fields, type Files, type File } from "formidable";
import { resolveAdminSession } from "../../../lib/admin-session";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedFolders = new Set(["collections", "products"]);

function sanitizeSegment(value: string | undefined, fallback: string): string {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function readFirstField(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeFiles(value: File | File[] | undefined): File[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getSafeExtension(file: File): string {
  const originalExtension = path.extname(file.originalFilename ?? "").toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  switch (file.mimetype) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}

function parseMultipartForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({
    multiples: true,
    maxFiles: 10,
    maxFileSize: 8 * 1024 * 1024,
    keepExtensions: true
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const session = await resolveAdminSession(req, res);
  if (!session) {
    res.status(401).json({ message: "Sesion administrativa requerida" });
    return;
  }

  try {
    const { fields, files } = await parseMultipartForm(req);
    const folderValue = readFirstField(fields.folder);
    const entitySlug = sanitizeSegment(readFirstField(fields.entitySlug), "sin-slug");
    const folder = allowedFolders.has(folderValue ?? "") ? folderValue! : "products";
    const uploadedFiles = normalizeFiles(files.files);

    if (uploadedFiles.length === 0) {
      res.status(400).json({ message: "No se recibieron archivos" });
      return;
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", folder, entitySlug);
    await mkdir(uploadDirectory, { recursive: true });

    const savedFiles = await Promise.all(
      uploadedFiles.map(async (file) => {
        if (!file.mimetype || !allowedMimeTypes.has(file.mimetype)) {
          throw new Error("Formato no soportado. Usa PNG, JPG o WEBP.");
        }

        const safeBaseName = sanitizeSegment(
          path.basename(file.originalFilename ?? "imagen", path.extname(file.originalFilename ?? "")),
          "imagen"
        );
        const finalFileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBaseName}${getSafeExtension(
          file
        )}`;
        const finalPath = path.join(uploadDirectory, finalFileName);

        await copyFile(file.filepath, finalPath);
        await unlink(file.filepath).catch(() => undefined);

        return {
          url: `/uploads/${folder}/${entitySlug}/${finalFileName}`,
          originalName: file.originalFilename ?? finalFileName,
          size: file.size
        };
      })
    );

    res.status(201).json({ files: savedFiles });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "No se pudieron subir los archivos"
    });
  }
}
