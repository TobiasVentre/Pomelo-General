# Prompt Base para construir Pomelo-BE (MVP Demo)

Actua como arquitecto y desarrollador senior backend.
Necesito que construyas el backend de un ecommerce llamado **Pomelo** con foco en demo MVP.

## 1) Stack obligatorio
- Node.js
- TypeScript
- MySQL
- Docker / Docker Compose

## 2) Arquitectura obligatoria
Implementar arquitectura **hexagonal estricta** + **Repository** + **CQRS** + **DI** + **SOLID**.

Reglas:
1. `Domain` sin dependencias de framework.
2. `Application` depende solo de `Domain`.
3. `Infrastructure` implementa puertos de `Application`.
4. `Api` delgada, sin logica de negocio.
5. Services de `Application` separados por caso de uso (no service gigante).
6. CQRS:
   - Interfaces/contratos de Commands y Queries en `Application`.
   - Implementaciones concretas de Commands y Queries en `Infrastructure`.
   - Ubicar implementaciones de CQRS en `Infrastructure/Commands` e `Infrastructure/Queries`, al mismo nivel que `Infrastructure/Persistence`.
7. Interfaces de repositorio en `Application`; implementaciones en `Infrastructure`.
8. Manejo global de errores con respuesta consistente.
9. Logging estructurado.

## 3) Contexto funcional MVP
Mercado: Argentina.
Producto principal: remeras.
Modelo comercial: colecciones separadas por color.
Sin auth por ahora (solo vista cliente).
Sin pagos por ahora.
Checkout final por WhatsApp (link con detalle de pedido).
Envio mockeado.
Stock fuera de MVP (pero dejar preparado para stock global futuro).

## 4) Entidades y modelo de datos (MVP robusto)
### Collection
- id (uuid)
- slug (string unico)
- name (string) // ej: Amarillo, Azul
- colorHex (string)
- coverImageUrl (string)
- description (string)
- isActive (boolean)
- displayOrder (int)
- createdAt, updatedAt

### Product
- id (uuid)
- slug (string unico)
- sku (string unico)
- name (string)
- category (string) // por ahora "Remeras"
- collectionId (fk -> Collection.id)
- subtitle (string)
- description (text)
- priceArs (decimal)
- rating (decimal opcional)
- isActive (boolean)
- displayOrder (int)
- shippingInfo (string)
- fabricCare (string)
- createdAt, updatedAt

### ProductColor
- id (uuid)
- productId (fk)
- name (string)
- hex (string)

### ProductSize
- id (uuid)
- productId (fk)
- size (string) // XS,S,M,L,XL

### ProductImage
- id (uuid)
- productId (fk)
- url (string)
- type (string) // thumbnail, hover, gallery
- sortOrder (int)

## 5) Casos de uso iniciales (CQRS)
Implementar al menos:

### Collections
- Query: `GetCollectionsQuery` (solo activas, ordenadas)
- Query: `GetCollectionBySlugQuery`

### Products
- Query: `GetProductsQuery` con filtros:
  - `collection` (slug)
  - `category`
  - `activeOnly`
  - paginacion basica (`page`, `pageSize`)
- Query: `GetProductBySlugQuery`
- Command: `CreateProductCommand` (para carga inicial/admin futura)
- Command: `UpdateProductCommand` (borrador para evolucion)

## 6) Endpoints HTTP requeridos
- `GET /api/health`
- `GET /api/collections`
- `GET /api/collections/:slug`
- `GET /api/products?collection=&category=&page=&pageSize=`
- `GET /api/products/:slug`
- `POST /api/products` (inicial, protegido luego; ahora simple)
- `PUT /api/products/:id` (inicial, protegido luego; ahora simple)

## 7) Reglas de API
- Respuestas JSON consistentes.
- Validacion de inputs.
- Errores en formato uniforme (codigo, mensaje, detalles).
- No exponer stack traces en produccion.

## 8) Infraestructura y despliegue
Crear:
- `Dockerfile` backend
- `docker-compose.yml` con:
  - servicio `api`
  - servicio `mysql`
- variables de entorno para DB, puerto, modo app.

Agregar script de inicializacion DB (migraciones o schema SQL inicial).

## 9) Testing y calidad
- Unit tests para Application (casos de uso).
- Integration tests minimos para repositorios MySQL.
- Scripts npm:
  - `dev`
  - `build`
  - `start`
  - `test`
  - `lint`

## 10) Entregables esperados
1. Arbol de carpetas completo del BE.
2. Codigo base compilable y ejecutable por Docker.
3. Ejemplo real de:
   - 1 command
   - 1 query
   - 1 endpoint
4. Checklist de cumplimiento hexagonal/CQRS/Repository/DI/SOLID.
5. ADR breve con decisiones tecnicas y tradeoffs.

## 11) Restricciones importantes
- Evitar services gigantes/anemicos.
- No mezclar infraestructura dentro de Application.
- Mantener codigo simple y extensible para siguientes MVPs.

## 12) Objetivo final de esta iteracion
Backend listo para conectar con el frontend actual:
- listar colecciones por color
- listar productos filtrados por coleccion
- obtener detalle de producto por slug
