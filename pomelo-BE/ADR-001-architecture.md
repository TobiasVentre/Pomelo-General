# ADR-001 - Arquitectura Base Pomelo-BE

Fecha: 2026-03-07
Estado: Aprobado

## Contexto
Se necesita un backend Node.js + TypeScript + MySQL, dockerizado, con arquitectura mantenible para escalar desde MVP demo hacia un ecommerce completo.

## Decision
- Adoptar arquitectura hexagonal.
- Separar `Application`, `Domain`, `Infrastructure`, `Api`.
- Definir CQRS con:
  - contratos/interfaces en `Application`.
  - implementaciones concretas en `Infrastructure/Commands` e `Infrastructure/Queries`.
- Mantener `Persistence` separada en `Infrastructure/Persistence`.
- Services en `Application` separados por caso de uso.

## Consecuencias
- Mayor claridad de responsabilidades y menor acoplamiento.
- Curva inicial un poco mayor que una arquitectura plana.
- Facilita testeo unitario de `Application` y reemplazo de adaptadores.
