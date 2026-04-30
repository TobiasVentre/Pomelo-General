import { DomainError } from "./domain-error";

export class UpstreamError extends DomainError {
  readonly code = "UPSTREAM_ERROR";
  readonly httpStatus = 502;

  constructor(provider: string, detail: string) {
    super(`${provider} gateway error: ${detail}`);
  }
}
