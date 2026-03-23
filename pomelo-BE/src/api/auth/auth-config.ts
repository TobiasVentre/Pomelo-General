import dotenv from "dotenv";

dotenv.config();

export interface AuthConfig {
  jwtSecret: string;
  jwtIssuer?: string;
  jwtAudience?: string;
}

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function readAuthConfig(): AuthConfig {
  const jwtSecret = readOptional("AUTH_JWT_SECRET");

  if (!jwtSecret) {
    throw new Error("Missing auth config: AUTH_JWT_SECRET");
  }

  return {
    jwtSecret,
    jwtIssuer: readOptional("AUTH_JWT_ISSUER"),
    jwtAudience: readOptional("AUTH_JWT_AUDIENCE")
  };
}
