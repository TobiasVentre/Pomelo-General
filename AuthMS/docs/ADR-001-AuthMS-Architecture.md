# ADR-001 - AuthMS Architecture

## Estado

Aceptado

## Contexto

`AuthMS` concentraba toda la composicion en `Program.cs`, manejaba errores desde cada controller y mantenia dependencias web dentro de `Application`, en particular para resolver el usuario autenticado.

## Decision

- Renombrar fisicamente el runtime a `src/AuthMS.Api` y alinear la solucion al layout `src/<MS>.*` y `tests/<MS>.*`.
- Separar la composicion en `AddApplication()`, `AddInfrastructure()` y `AddApi()`.
- Mantener los servicios funcionales actuales de autenticacion, autorizacion, password reset, verificacion de email y notificaciones.
- Centralizar el manejo de errores HTTP con `GlobalExceptionMiddleware`.
- Introducir `ICurrentUserContext` como puerto de aplicacion para evitar dependencia directa de `HttpContext` dentro de `Application`.
- Mantener los endpoints legacy marcados como obsoletos mientras se completa la decomposicion funcional hacia otros microservicios.

## Consecuencias

- `AuthMS` queda mas alineado con la arquitectura objetivo sin perder compatibilidad funcional actual.
- La capa `Application` deja de depender de ASP.NET Core para obtener identidad del usuario autenticado.
- El wiring de infraestructura y API queda aislado y reemplazable.
- La salida futura de endpoints legacy puede hacerse sin volver a modificar la estructura arquitectonica del microservicio.
