import { DomainError, type ProblemDetails } from "./domain-error";

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly httpStatus = 400;

  constructor(
    message: string,
    readonly details: string[] = []
  ) {
    super(message);
  }

  override toProblemDetails(instance: string): ProblemDetails {
    return { ...super.toProblemDetails(instance), errors: this.details };
  }
}
