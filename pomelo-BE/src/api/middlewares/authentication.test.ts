import assert from "node:assert/strict";
import crypto from "node:crypto";
import test, { afterEach, beforeEach } from "node:test";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole, verifyAccessToken } from "./authentication";

const originalSecret = process.env.AUTH_JWT_SECRET;
const originalIssuer = process.env.AUTH_JWT_ISSUER;
const originalAudience = process.env.AUTH_JWT_AUDIENCE;

function signAuthMsCompatibleToken(payload: Record<string, unknown>): string {
  const rawSecret = process.env.AUTH_JWT_SECRET as string;
  const keyBytes = Buffer.from(rawSecret, "utf8");
  const signingSecret =
    keyBytes.length >= 32
      ? keyBytes
      : crypto.createHash("sha256").update(keyBytes).digest();

  return jwt.sign(payload, signingSecret, {
    algorithm: "HS256",
    expiresIn: "1h"
  });
}

function createResponseDouble(): Response {
  return {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  } as Response & { statusCode: number; body?: unknown };
}

function createRequestDouble(token?: string): Request {
  return {
    header(name: string) {
      if (name !== "Authorization" || !token) {
        return undefined;
      }

      return `Bearer ${token}`;
    }
  } as Request;
}

beforeEach(() => {
  process.env.AUTH_JWT_SECRET = "dev-super-secret-key-change-me";
  delete process.env.AUTH_JWT_ISSUER;
  delete process.env.AUTH_JWT_AUDIENCE;
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.AUTH_JWT_SECRET;
  } else {
    process.env.AUTH_JWT_SECRET = originalSecret;
  }

  if (originalIssuer === undefined) {
    delete process.env.AUTH_JWT_ISSUER;
  } else {
    process.env.AUTH_JWT_ISSUER = originalIssuer;
  }

  if (originalAudience === undefined) {
    delete process.env.AUTH_JWT_AUDIENCE;
  } else {
    process.env.AUTH_JWT_AUDIENCE = originalAudience;
  }
});

test("verifyAccessToken should accept AuthMS-compatible admin token", () => {
  const token = signAuthMsCompatibleToken({
    sub: "admin-user-id",
    UserId: "admin-user-id",
    UserEmail: "admin@pomelo.test",
    UserRole: "Admin",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin"
  });

  const user = verifyAccessToken(token);

  assert.equal(user.userId, "admin-user-id");
  assert.equal(user.role, "Admin");
  assert.equal(user.email, "admin@pomelo.test");
});

test("requireAuth should return 401 when token is missing", () => {
  const request = createRequestDouble();
  const response = createResponseDouble();
  let nextCalled = false;

  requireAuth(request, response, (() => {
    nextCalled = true;
  }) as NextFunction);

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 401);
});

test("requireRole should return 403 when role is not allowed", () => {
  const token = signAuthMsCompatibleToken({
    sub: "client-user-id",
    UserId: "client-user-id",
    UserRole: "Client"
  });

  const request = createRequestDouble(token);
  const response = createResponseDouble();
  let nextCalled = false;

  requireRole("Admin")(request, response, (() => {
    nextCalled = true;
  }) as NextFunction);

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 403);
});

test("requireRole should allow admin tokens", () => {
  const token = signAuthMsCompatibleToken({
    sub: "admin-user-id",
    UserId: "admin-user-id",
    UserRole: "Admin"
  });

  const request = createRequestDouble(token);
  const response = createResponseDouble();
  let nextCalled = false;

  requireRole("Admin")(request, response, (() => {
    nextCalled = true;
  }) as NextFunction);

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
  assert.equal(request.auth?.role, "Admin");
});
