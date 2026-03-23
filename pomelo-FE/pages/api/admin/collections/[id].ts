import type { NextApiRequest, NextApiResponse } from "next";
import { resolveAdminSession } from "../../../../lib/admin-session";
import { getBackendApiBase } from "../../../../lib/backend-api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const session = await resolveAdminSession(req, res);
  if (!session) {
    res.status(401).json({ message: "Sesion administrativa requerida" });
    return;
  }

  const id = req.query.id;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const response = await fetch(`${getBackendApiBase()}/api/collections/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
