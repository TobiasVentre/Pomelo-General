# Pomelo FE (Next.js + Tailwind)

Homepage editorial de ecommerce de moda.

## Stack
- Next.js (Pages Router)
- React
- TailwindCSS
- Tipado con TypeScript

## Secciones implementadas
- Header sticky y transparente sobre hero.
- Hero full-width con imagen principal y contenido overlay.
- Featured categories en grilla de 3 columnas con hover zoom.
- Editorial grid de dos banners asimetricos.
- Responsive para mobile/tablet/desktop.

## Ejecutar local
1. `npm install`
2. Crear `.env.local` basado en `.env.local.example`
3. `npm run dev`
4. Abrir `http://localhost:5174`

## Integracion FE -> BE
- Por defecto consume `http://localhost:4000`.
- Variables:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `API_BASE_URL`
- Landing (`/`), Shop (`/shop`) y Product Detail (`/product/[slug]`) dependen de la API del backend.

## Exponer demo por internet con ngrok
1. Instalar ngrok (una vez):
   - `winget install ngrok.ngrok`
2. Configurar token (una vez):
   - `ngrok config add-authtoken TU_TOKEN`
3. Terminal 1:
   - `npm run dev:host`
4. Terminal 2:
   - `npm run tunnel`
5. Compartir la URL `https://...ngrok-free.app` que entrega ngrok.
