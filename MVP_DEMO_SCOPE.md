# Pomelo Ecommerce - Alcance MVP Demo (Aprobado)

Fecha de definicion: 2026-03-07
Objetivo: demo funcional para cliente, priorizando experiencia web visible (FE) sobre completitud operativa.

## 1) Alcance funcional incluido en MVP
- Catalogo de productos.
- Carrito de compras.
- Checkout inicial via WhatsApp.

## 2) Definicion de checkout MVP
- No hay pasarela de pago en este MVP.
- El checkout finaliza en un link a WhatsApp con mensaje prearmado.
- El mensaje debe incluir detalle del pedido (productos, variantes, cantidades y total estimado).

## 3) Funcionalidades explicitamente fuera de alcance (MVP)
- Pagos online.
- Autenticacion/autorizacion.
- Panel administrativo.
- Gestion de stock.
- Calculo de envio real por operador.

## 4) Decisiones de negocio confirmadas
- Mercado objetivo inicial: Republica Argentina.
- Catalogo: colecciones -> remeras -> variantes (talle y color).
- Envio: calculo mockeado para la demo.
- Auth: sin login; persistencia en cookies para sostener experiencia del usuario.
- Stock: no incluido en MVP; futuro esquema con stock global.

## 5) Roadmap inmediato (post-demo)
- Integrar Mercado Pago en el siguiente MVP.
- Incorporar autenticacion con roles admin/cliente.
- Agregar gestion de stock global.

## 6) Criterio de exito de esta etapa
- Cliente puede navegar catalogo, seleccionar variantes, armar carrito y generar pedido por WhatsApp desde la web.
- Demo estable, clara y presentable aunque el backend sea parcial o mockeado.

