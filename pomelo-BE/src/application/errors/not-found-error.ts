import { DomainError } from "./domain-error";

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly httpStatus = 404;

  constructor(resource: string, identifier: string) {
    super(`${resource} '${identifier}' not found`);
  }
}
