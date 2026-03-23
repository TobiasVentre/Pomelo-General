# Pomelo Ecommerce - Session Memory

Ultima actualizacion: 2026-03-07
Proposito: conservar decisiones, supuestos y modo de trabajo para retomar rapido en futuras sesiones.

## 1) Objetivo actual
- Construir una demo web funcional de ecommerce para cliente.
- Prioridad: experiencia visible de punta a punta (catalogo -> carrito -> checkout WhatsApp).

## 2) Alcance MVP vigente (fuente: MVP_DEMO_SCOPE.md)
- Incluye:
  - Catalogo de productos.
  - Carrito de compras.
  - Checkout por WhatsApp con detalle de pedido.
- Excluye en esta etapa:
  - Pasarela de pago.
  - Auth y roles.
  - Panel admin.
  - Stock real.
  - Calculo real de envio (se usa mock).

## 3) Decisiones de arquitectura
- Repo: monorepo con `pomelo-BE/` y `pomelo-FE/`.
- Backend: Node.js + TypeScript + MySQL + Docker.
- Frontend: React + HTML + CSS.
- Estilo arquitectonico:
  - BE: hexagonal + repository + CQRS + DI + SOLID.
  - FE: hexagonal para evitar monolito.

## 4) Supuestos de negocio confirmados
- Mercado inicial: Republica Argentina.
- Dominio inicial: colecciones con remeras y variantes de talle/color.
- Stock se incorpora despues (modelo futuro: stock global).
- Pagos se incorporan despues (objetivo siguiente MVP: Mercado Pago).

## 5) Forma de trabajo acordada
- Priorizar decisiones pragmaticas para demo sin romper arquitectura.
- Registrar cambios de alcance/arquitectura en markdown en la raiz.
- Evitar supuestos implicitos: todo cambio relevante debe quedar escrito.

## 6) Regla de continuidad entre sesiones
- Al iniciar una nueva sesion:
  1. Leer `MVP_DEMO_SCOPE.md`.
  2. Leer `PROJECT_GUIDELINES.md`.
  3. Leer este archivo `SESSION_MEMORY.md`.
- Si hay cambios, actualizar primero este archivo y luego ejecutar trabajo tecnico.

## 7) Backlog inmediato
1. Crear skeleton FE hexagonal para demo.
2. Implementar flujo catalogo -> carrito -> checkout WhatsApp en FE.
3. Definir si BE arranca mockeado o con API minima real desde el primer corte.

