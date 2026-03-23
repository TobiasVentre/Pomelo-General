import type { NextApiRequest, NextApiResponse } from "next";
import { resolveAdminSession } from "../../../lib/admin-session";
import { getBackendApiBase } from "../../../lib/backend-api";

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

  const response = await fetch(`${getBackendApiBase()}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
