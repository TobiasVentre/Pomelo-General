# Pomelo-BE

Backend MVP para Pomelo ecommerce.

## Stack
- Node.js + TypeScript
- Express
- MySQL
- Docker

## Arquitectura
- `src/domain`
- `src/application`
- `src/infrastructure`
  - `commands`
  - `queries`
  - `persistence`
  - `di`
- `src/api`

## Endpoints disponibles
- `GET /api/health`
- `GET /api/collections`
- `GET /api/collections/:slug`
- `POST /api/collections`
- `PUT /api/collections/:id`
- `GET /api/products?collection=&category=&activeOnly=&page=&pageSize=`
- `GET /api/products/:slug`
- `POST /api/products`
- `PUT /api/products/:id`
- `POST /api/shipping/quote`
- `POST /api/shipping/shipments`
- `GET /api/shipping/shipments/:shipmentId/track`
- `GET /api/docs` (Swagger UI)
- `GET /api/openapi.json` (spec OpenAPI)

## Ejecutar local
1. Copiar `.env.example` a `.env`
2. Instalar dependencias: `npm install`
3. Ejecutar en dev: `npm run dev`

## Ejecutar con Docker
```bash
docker compose up --build
```

API:
- `http://localhost:4000/api/health`
- `http://localhost:4000/api/collections`
- `http://localhost:4000/api/products`
- `http://localhost:4000/api/shipping/quote`
- `http://localhost:4000/api/shipping/shipments`
- `http://localhost:4000/api/docs`

## OCA (test)
El backend incluye integracion con OCA en entorno de prueba.

Variables relevantes:
- `OCA_API_BASE_URL`
- `OCA_LOGIN_PATH`
- `OCA_CREATE_SHIPMENT_PATH`
- `OCA_TRACK_CURRENT_STATUS_PATH`
- `OCA_TRACK_HISTORY_PATH`
- `OCA_CLIENT`
- `OCA_USER`
- `OCA_PASSWORD`
- `OCA_PRODUCT_CODE`

Notas:
- La cotizacion `POST /api/shipping/quote` es estimada para demo.
- La creacion y tracking de envios se ejecutan contra los endpoints configurados de OCA test.
