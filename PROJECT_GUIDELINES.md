# Pomelo Ecommerce - Lineamientos del Proyecto

## 1) Objetivo del producto
- Construir un ecommerce web para venta de indumentaria juvenil femenina (inicio: remeras).
- Priorizar una base tecnica solida para crecer a nuevas categorias, medios de pago y canales.

## 2) Alcance inicial (MVP propuesto)
- Ver alcance cerrado en `MVP_DEMO_SCOPE.md` (fuente oficial de este ciclo).
- En esta etapa, foco principal en demo funcional para cliente final.

## 3) Stack definido
- Backend: Node.js + TypeScript + MySQL + Docker.
- Frontend: React + HTML + CSS.
- Arquitectura:
  - BE: Hexagonal + Repository + CQRS + DI + SOLID.
  - FE: Hexagonal (dominio/aplicacion/infraestructura/UI) evitando monolito.

## 4) Estructura inicial del repositorio
- `pomelo-BE/`
- `pomelo-FE/`

## 5) Lineamientos de arquitectura BE (adaptados de prompt-arquitectura-BE.txt)
- Domain: sin dependencias de framework.
- Application: solo depende de Domain.
- Infrastructure: implementa puertos de Application (repositorios, DB, servicios externos).
- API: controladores/handlers delgados, sin logica de negocio.
- CQRS:
  - Services de Application separados por caso de uso.
  - Contratos/interfaces de Commands y Queries en Application.
  - Implementaciones concretas de Commands y Queries en Infrastructure.
  - Ubicar `Infrastructure/Commands` e `Infrastructure/Queries` al mismo nivel que `Infrastructure/Persistence`.
  - Un handler por operacion.
- Repository:
  - Interfaces en Application.
  - Implementaciones en Infrastructure.
- DI:
  - Modulos de composicion separados (application/infrastructure/api).
  - Bootstrap liviano en el entrypoint.
- Errores:
  - Manejo global y respuestas consistentes.
- Calidad:
  - Unit tests de Application.
  - Integration tests minimos de Infrastructure.
  - Logging estructurado.

## 6) Lineamientos de arquitectura FE
- Domain: entidades, reglas y value objects de UI.
- Application: casos de uso y coordinacion.
- Infrastructure: clientes HTTP, mappers, storage.
- UI: componentes/paginas sin logica de negocio pesada.
- Estado:
  - Definir fronteras claras entre estado de servidor y estado local de UI.
- Diseno:
  - Sistema de componentes reusable para evitar duplicacion.

## 7) Entregables tecnicos por fases
1. Base repo + Docker + convenciones + CI minima.
2. BE base compilable con 1 comando, 1 query y 1 endpoint.
3. FE base compilable con estructura hexagonal y primer flujo.
4. Integracion FE-BE para catalogo y carrito.
5. Hardening (tests, observabilidad, seguridad, performance).

## 8) Decisiones y tradeoffs iniciales
- Monorepo con dos carpetas separadas para facilitar desarrollo coordinado.
- Arquitectura hexagonal desde el inicio para reducir deuda tecnica futura.
- CQRS aplicado pragmaticamente (sin sobre-ingenieria en MVP).

## 9) Riesgos conocidos
- Sobre-dise;o temprano que frene la entrega de negocio.
- Falta de definicion funcional (pagos, envios, impuestos).
- Integraciones de terceros sin contrato claro.

## 10) Preguntas abiertas (para cerrar antes de implementar)
1. Alcance MVP exacto: que funcionalidades son obligatorias para go-live?
2. Mercado inicial: solo Argentina o multi-pais?
3. Moneda/impuestos/facturacion: reglas que debemos soportar desde el dia 1?
4. Pagos: que proveedor usar (Mercado Pago, Stripe, otro)?
5. Envios: operador/logistica y reglas de costo?
6. Auth: email+password, Google, ambos?
7. Roles: que perfiles administrativos necesitamos y permisos?
8. Catalogo: variantes (talle/color), promociones, cupones en MVP?
9. Inventario: stock por deposito/sucursal o unico global?
10. No funcionales: SLA esperado, trafico inicial, picos, presupuesto de infraestructura?
11. Compliance: requerimientos legales (proteccion de datos, terminos, devoluciones)?
12. Contenido: idioma unico (es) o multi-idioma desde el inicio?

## 11) Acuerdos de trabajo
- Todo cambio de arquitectura relevante se registra en ADR corto.
- Definiciones funcionales se versionan en este archivo hasta crear docs especificos.
- Evitar decisiones implicitas: dejar supuestos explicitados.
- Para decisiones de producto del MVP actual, priorizar `MVP_DEMO_SCOPE.md`.
- Para continuidad de contexto entre sesiones, mantener actualizado `SESSION_MEMORY.md`.
