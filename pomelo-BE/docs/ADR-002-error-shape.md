# ADR-002 — Error response shape (ProblemDetails RFC 7807)

**Fecha:** 2026-04-30
**Estado:** Aprobado

## Contexto

El backend necesita una convención uniforme para los cuerpos de respuesta de error. Antes de Fase 2, cada endpoint devolvía su propio shape ad-hoc (`{ code, message, details }`), sin un estándar formal.

## Decisión

Adoptar **RFC 7807 — Problem Details for HTTP APIs** como shape canónico.

Shape de respuesta:

```json
{
  "type": "https://pomelo.ar/errors/<kebab-code>",
  "title": "SNAKE_CASE_CODE",
  "status": 400,
  "detail": "Mensaje legible por humanos",
  "instance": "/api/products",
  "errors": ["campo.path: mensaje"]
}
```

- `type`: URI que identifica el tipo de problema. No necesita ser navegable; sirve como identificador estable.
- `title`: código machine-readable del error (`NOT_FOUND`, `VALIDATION_ERROR`, `UPSTREAM_ERROR`, etc.).
- `status`: HTTP status code repetido en el cuerpo para facilitar logging del lado cliente.
- `detail`: descripción legible del error puntual.
- `instance`: path del request que originó el error.
- `errors` (extensión, opcional): lista de errores de validación campo a campo. Solo presente en `VALIDATION_ERROR`.

## Implementación

- `DomainError.toProblemDetails(instance)` produce el shape en todas las subclases.
- `ZodError` se mapea a `ValidationError` en `error-handler.ts`; los `issues` de Zod se formatean como `"field.path: mensaje"` en el array `errors`.
- Errores inesperados (no `DomainError`, no `ZodError`) producen el mismo shape con `title: "INTERNAL_ERROR"` y `status: 500`.

## Códigos definidos

| title            | status | cuando                                      |
|------------------|--------|---------------------------------------------|
| VALIDATION_ERROR | 400    | payload no supera el schema Zod             |
| UNAUTHORIZED     | 401    | token ausente o inválido                    |
| FORBIDDEN        | 403    | rol insuficiente                            |
| NOT_FOUND        | 404    | recurso no encontrado por slug/id           |
| INTERNAL_ERROR   | 500    | excepción no anticipada                     |
| UPSTREAM_ERROR   | 502    | falla en gateway externo (OCA u otro)       |

## Consecuencias

- Clientes de la API tienen un contrato predecible para manejar errores.
- El campo `errors[]` permite mostrar errores de campo en formularios sin parsing adicional.
- Los tests que aserten `body.code === "VALIDATION_ERROR"` deben migrar a `body.title`.
