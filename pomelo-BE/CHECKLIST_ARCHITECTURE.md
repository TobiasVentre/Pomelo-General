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
- [x] Manejo global de errores en middleware.
- [x] Dockerfile + docker-compose incluidos.
