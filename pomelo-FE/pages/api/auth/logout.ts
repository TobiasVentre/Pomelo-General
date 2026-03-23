import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthApiBase } from "../../../lib/auth-api";
import { clearAdminSessionCookies, readAdminSessionTokens } from "../../../lib/admin-session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const tokens = readAdminSessionTokens(req);

  if (tokens) {
    try {
      await fetch(`${getAuthApiBase()}/api/v1/Auth/Logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken
        })
      });
    } catch {
      // Best effort: the local cookies are cleared regardless of AuthMS response.
    }
  }

  clearAdminSessionCookies(res);
  res.status(200).json({ message: "Sesion cerrada" });
}
