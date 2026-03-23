import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthApiBase } from "../../../lib/auth-api";
import {
  clearAdminSessionCookies,
  setAdminSessionCookies,
  verifyAdminAccessToken
} from "../../../lib/admin-session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const response = await fetch(`${getAuthApiBase()}/api/v1/Auth/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body)
  });

  const data = (await response.json()) as {
    message?: string;
    accessToken?: string;
    refreshToken?: string;
  };

  if (!response.ok || !data.accessToken || !data.refreshToken) {
    clearAdminSessionCookies(res);
    res.status(response.status).json({
      message: data.message ?? "No se pudo iniciar sesion"
    });
    return;
  }

  try {
    verifyAdminAccessToken(data.accessToken);
  } catch {
    clearAdminSessionCookies(res);
    res.status(403).json({
      message: "La cuenta autenticada no tiene permisos de administrador"
    });
    return;
  }

  setAdminSessionCookies(res, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  });

  res.status(200).json({ message: "Sesion iniciada correctamente" });
}
