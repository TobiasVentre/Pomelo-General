export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: string[];
}

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  toProblemDetails(instance: string): ProblemDetails {
    return {
      type: `https://pomelo.ar/errors/${this.code.toLowerCase().replace(/_/g, "-")}`,
      title: this.code,
      status: this.httpStatus,
      detail: this.message,
      instance
    };
  }
}
