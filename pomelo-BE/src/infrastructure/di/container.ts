import { registerApplication, type ApplicationDeps } from "../../application/di/register-application";
import { env } from "../config/env";
import { registerInfrastructure } from "./register-infrastructure";

export type Container = ApplicationDeps;

export function buildContainer(): Container {
  const infra = registerInfrastructure(env);
  return registerApplication(infra, env.ocaProductCode);
}
