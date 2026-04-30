import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { getAuthApiBase } from "./auth-api";

const ACCESS_COOKIE_NAME = "pomelo_admin_access_token";
const REFRESH_COOKIE_NAME = "pomelo_admin_refresh_token";
const HINT_COOKIE_NAME = "pomelo_admin_hint";
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const NAME_ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string | null;
  userId: string | null;
  role: string | null;
  email: string | null;
  claims: Record<string, unknown>;
}

function readOptionalEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getAuthJwtSecret(): string {
  const value = readOptionalEnv(["AUTH_JWT_SECRET", "JWT_KEY"]);
  if (!value) {
    throw new Error("Missing auth config: AUTH_JWT_SECRET");
  }

  return value;
}

function deriveJwtSecret(secret: string): Buffer {
  const keyBytes = Buffer.from(secret, "utf8");

  if (keyBytes.length >= 32) {
    return keyBytes;
  }

  return crypto.createHash("sha256").update(keyBytes).digest();
}

function shouldUseSecureCookies(): boolean {
  const rawValue = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex < 0) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
  } = {}
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  parts.push(`Path=${options.path ?? "/"}`);

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function appendSetCookie(response: ServerResponse, cookies: string[]): void {
  const existing = response.getHeader("Set-Cookie");

  if (!existing) {
    response.setHeader("Set-Cookie", cookies);
    return;
  }

  const normalizedExisting = Array.isArray(existing) ? existing : [String(existing)];
  response.setHeader("Set-Cookie", [...normalizedExisting, ...cookies]);
}

function readStringClaim(payload: Record<string, unknown>, claimNames: string[]): string | null {
  for (const claimName of claimNames) {
    const value = payload[claimName];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export function setAdminSessionCookies(response: ServerResponse, tokens: TokenPair): void {
  const secure = shouldUseSecureCookies();

  appendSetCookie(response, [
    serializeCookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      maxAge: 60 * 60,
      secure,
      sameSite: "Lax"
    }),
    serializeCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      maxAge: 60 * 60 * 24,
      secure,
      sameSite: "Lax"
    }),
    serializeCookie(HINT_COOKIE_NAME, "1", {
      maxAge: 60 * 60,
      httpOnly: false,
      secure,
      sameSite: "Lax"
    })
  ]);
}

export function clearAdminSessionCookies(response: ServerResponse): void {
  const secure = shouldUseSecureCookies();

  appendSetCookie(response, [
    serializeCookie(ACCESS_COOKIE_NAME, "", {
      maxAge: 0,
      secure,
      sameSite: "Lax"
    }),
    serializeCookie(REFRESH_COOKIE_NAME, "", {
      maxAge: 0,
      secure,
      sameSite: "Lax"
    }),
    serializeCookie(HINT_COOKIE_NAME, "", {
      maxAge: 0,
      httpOnly: false,
      secure,
      sameSite: "Lax"
    })
  ]);
}

export function verifyAdminAccessToken(accessToken: string): AdminSession {
  const verified = jwt.verify(accessToken, deriveJwtSecret(getAuthJwtSecret()), {
    algorithms: ["HS256"]
  });

  if (typeof verified === "string") {
    throw new Error("Invalid JWT payload");
  }

  const payload = verified as JwtPayload & Record<string, unknown>;
  const role = readStringClaim(payload, ["role", ROLE_CLAIM, "UserRole"]);

  if (role !== "Admin") {
    throw new Error("Admin role required");
  }

  return {
    accessToken,
    refreshToken: null,
    userId: readStringClaim(payload, ["UserId", "sub", NAME_ID_CLAIM]),
    role,
    email: readStringClaim(payload, ["UserEmail", "email"]),
    claims: payload
  };
}

async function requestTokenRefresh(tokens: TokenPair): Promise<TokenPair | null> {
  const response = await fetch(`${getAuthApiBase()}/api/v1/Auth/RefreshToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expiredAccessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    })
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!json.accessToken || !json.refreshToken) {
    return null;
  }

  return {
    accessToken: json.accessToken,
    refreshToken: json.refreshToken
  };
}

export function readAdminSessionTokens(request: IncomingMessage): TokenPair | null {
  const cookies = parseCookieHeader(request.headers.cookie);
  const accessToken = cookies[ACCESS_COOKIE_NAME];
  const refreshToken = cookies[REFRESH_COOKIE_NAME];

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function resolveAdminSession(
  request: IncomingMessage,
  response?: ServerResponse
): Promise<AdminSession | null> {
  const tokens = readAdminSessionTokens(request);

  if (!tokens) {
    if (response) {
      clearAdminSessionCookies(response);
    }
    return null;
  }

  try {
    const session = verifyAdminAccessToken(tokens.accessToken);
    return {
      ...session,
      refreshToken: tokens.refreshToken
    };
  } catch {
    if (!response) {
      return null;
    }

    const refreshedTokens = await requestTokenRefresh(tokens);
    if (!refreshedTokens) {
      clearAdminSessionCookies(response);
      return null;
    }

    try {
      const session = verifyAdminAccessToken(refreshedTokens.accessToken);
      setAdminSessionCookies(response, refreshedTokens);

      return {
        ...session,
        refreshToken: refreshedTokens.refreshToken
      };
    } catch {
      clearAdminSessionCookies(response);
      return null;
    }
  }
}
