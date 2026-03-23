import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { readAuthConfig } from "../auth/auth-config";
import {
  NAME_ID_CLAIM,
  ROLE_CLAIM,
  type AuthenticatedUser
} from "../auth/auth-types";

function deriveJwtSecret(secret: string): Buffer {
  const keyBytes = Buffer.from(secret, "utf8");

  if (keyBytes.length >= 32) {
    return keyBytes;
  }

  return crypto.createHash("sha256").update(keyBytes).digest();
}

function readStringClaim(
  payload: Record<string, unknown>,
  claimNames: string[]
): string | null {
  for (const claimName of claimNames) {
    const value = payload[claimName];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function buildAuthenticatedUser(
  payload: Record<string, unknown>,
  token: string
): AuthenticatedUser {
  return {
    token,
    userId: readStringClaim(payload, ["UserId", "sub", NAME_ID_CLAIM]),
    role: readStringClaim(payload, ["role", ROLE_CLAIM, "UserRole"]),
    email: readStringClaim(payload, ["UserEmail", "email"]),
    claims: payload
  };
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  const authConfig = readAuthConfig();
  const verified = jwt.verify(token, deriveJwtSecret(authConfig.jwtSecret), {
    algorithms: ["HS256"],
    issuer: authConfig.jwtIssuer,
    audience: authConfig.jwtAudience
  });

  if (typeof verified === "string") {
    throw new Error("Invalid JWT payload");
  }

  return buildAuthenticatedUser(verified as JwtPayload & Record<string, unknown>, token);
}

function readBearerToken(request: Request): string | null {
  const authHeader = request.header("Authorization");
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export const requireAuth: RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const token = readBearerToken(request);

  if (!token) {
    response.status(401).json({
      code: "UNAUTHORIZED",
      message: "Missing bearer token",
      details: []
    });
    return;
  }

  try {
    request.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid bearer token";

    const statusCode =
      message.startsWith("Missing auth config:") ? 500 : 401;

    response.status(statusCode).json({
      code: statusCode === 500 ? "AUTH_CONFIG_ERROR" : "UNAUTHORIZED",
      message,
      details: []
    });
  }
};

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    requireAuth(request, response, () => {
      const currentRole = request.auth?.role;
      if (!currentRole || !allowedRoles.includes(currentRole)) {
        response.status(403).json({
          code: "FORBIDDEN",
          message: `Requires role: ${allowedRoles.join(", ")}`,
          details: []
        });
        return;
      }

      next();
    });
  };
}
