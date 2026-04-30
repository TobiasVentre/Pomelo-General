# ADR-003 — CQRS sin Repository explícito

**Fecha:** 2026-04-30
**Estado:** Aprobado

## Contexto

La arquitectura hexagonal clásica define un `IProductRepository` / `ICollectionRepository` como punto de abstracción entre Application e Infrastructure para persistencia. Este proyecto optó por CQRS sin esa capa intermedia.

## Decisión

No introducir interfaces de Repository (`IProductRepository`, `ICollectionRepository`). Las operaciones de escritura se modelan como `CommandHandler`; las de lectura como `QueryHandler`. Ambas tienen contratos definidos en `Application/cqrs/contracts/` e implementaciones en `Infrastructure/Commands` e `Infrastructure/Queries`.

## Tradeoffs

### Ventajas de la decisión tomada

- **Menos boilerplate:** un Repository genérico tiende a crecer hacia `findById`, `findAll`, `findBySlug`, `save`, `delete` — métodos que no siempre corresponden 1-a-1 con los casos de uso reales.
- **Queries optimizadas por caso de uso:** `GetProductsQueryMysqlImpl` hace un JOIN eficiente de 5 tablas ajustado a su único consumidor. Un repository genérico no puede exponer esa query sin romper la abstracción o exponerla a través de filtros arbitrarios.
- **Separación de lectura y escritura:** evita los conflictos ORM habituales entre modelos de lectura (proyecciones) y modelos de escritura (agregados).

### Costos asumidos

- **Scripts de migración o batch:** una operación que necesite leer Y escribir en la misma transacción (e.g. migrar datos en bulk) no tiene un punto único de acceso; debe orquestar directamente un command + query handler o acceder al pool de MySQL.
- **Sin punto único de abstracción para mocks en tests:** los tests unitarios de servicios deben mockear `CommandHandler` y `QueryHandler` por separado en lugar de un solo `IRepository`. En la práctica esto no generó fricciones dado que los services son delegadores con una sola dependencia cada uno.

## Alternativa descartada

Introducir `IProductRepository` con métodos `findBySlug`, `findById`, `save`, `update`. Se descartó porque:
1. `findById` no tiene consumidor actual.
2. `save` y `update` necesitarían manejar internamente la transacción o recibirla como parámetro — empujando la misma complejidad al repositorio.
3. La granularidad de CQRS ya proporciona el nivel de abstracción necesario para testabilidad.

## Revisión futura

Si aparece un caso de uso que requiera leer + escribir sobre el mismo agregado en la misma transacción (e.g. reservar stock al crear un pedido), se evaluará introducir `IUnitOfWork` (ver `ADR-004`) o un Repository puntual para ese agregado. No antes.
