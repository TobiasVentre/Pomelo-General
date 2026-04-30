# Checklist de Cumplimiento Arquitectura

- [x] `Domain` sin dependencias de framework.
- [x] `Application` depende de `Domain`.
- [x] `Infrastructure` implementa contratos de `Application`.
- [x] `Api` sin logica de negocio.
- [x] CQRS separado por caso de uso.
- [x] Contracts CQRS en `Application`.
- [x] Implementaciones CQRS en `Infrastructure/Commands` y `Infrastructure/Queries`.
- [x] `Commands/Queries` al mismo nivel que `Infrastructure/Persistence`.
- [x] Services de `Application` separados por caso de uso.
- [x] Manejo global de errores en middleware (mapea `DomainError` → HTTP code; 500 con log para el resto).
- [x] Dockerfile + docker-compose incluidos.
- [x] Tests en `tests/` espejando `src/` (no mezclados con el código).
- [x] DI segmentada: `registerInfrastructure` / `registerApplication` / composition root.
- [x] Jerarquía de excepciones de dominio (`DomainError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `UpstreamError`).
- [x] Logger estructurado (`pino`) — sin `console.log` en `src/`; `ILogger` definida en `Application`.
- [x] Validación migrada a Zod en `Application` — schemas en `src/application/validation/`; routes < 80 líneas; `ZodError` mapeado a `ValidationError` en el error handler.
- [x] Errores estandarizados ProblemDetails RFC 7807 — shape `{ type, title, status, detail, instance, errors? }` en todos los endpoints. Ver [`docs/ADR-002-error-shape.md`](./docs/ADR-002-error-shape.md).
- [x] Cobertura de tests — 76 tests en `tests/`; unit tests de 9 services, 13 tests de infrastructure (queries/commands/UoW), 11 tests de OcaShippingProvider, 16 tests de dominio + schemas. `npm run test:coverage` disponible (c8).
- [x] `IUnitOfWork` abstraída — `src/application/contracts/unit-of-work.ts` + `MysqlUnitOfWork`; test de rollback en `tests/infrastructure/persistence/`.
- [x] Entidades de dominio ricas — `Product` y `Collection` son clases con factory `create()` (valida invariantes), `reconstitute()` (DB loading sin validación) y métodos de mutación semánticos (`changePrice`, `deactivate`, `activate`, `replaceVariants`).

Ver plan completo: [PLAN-CUMPLIMIENTO-ARQUITECTURA.md](./PLAN-CUMPLIMIENTO-ARQUITECTURA.md)
