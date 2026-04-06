# Implementacion De Variantes Para Remeras

## Objetivo

Cambiar el detalle de producto de remeras para que el cliente pueda elegir:

1. Color de la tela.
2. Color de la estampa.

Cada combinacion `tela + estampa` debe tener sus propias imagenes, alojadas en el server, y al cambiar la seleccion debe actualizarse la imagen mostrada en la web.

Ademas, el panel de admin debe permitir cargar estas combinaciones de forma manual e intuitiva.

## Decisiones Confirmadas

- Cada combinacion `tela + estampa` tendra sus propias imagenes.
- Las imagenes se cargaran manualmente desde admin.
- La experiencia de carga en admin debe ser clara e intuitiva.

## Resultado Esperado

En la PDP de una remera:

- se ven 2 selectores de color
- uno corresponde a `Color de tela`
- otro corresponde a `Color de estampa`
- al cambiar la combinacion, se actualiza la galeria
- al agregar al carrito, se guarda la combinacion elegida

En el admin:

- cada producto puede tener multiples variantes
- cada variante representa una combinacion `tela + estampa`
- cada variante tiene su propia galeria de imagenes
- el admin puede agregar, editar y eliminar variantes
- el admin puede subir imagenes al server para cada variante

## Modelo Propuesto

En lugar de usar un solo `availableColors` y una sola lista `images` por producto, el producto pasara a tener `variants`.

Ejemplo logico:

```ts
variants: [
  {
    fabricColor: { name: "Negro", hex: "#111111" },
    printColor: { name: "Blanco", hex: "#ffffff" },
    images: ["/uploads/products/remera-a/negro-blanco-1.jpg"]
  }
]
```

## Orden De Implementacion

### 1. Ajustar modelo de datos en backend

Objetivo:

- reemplazar el modelo plano de colores e imagenes por variantes por combinacion

Archivos a tocar:

- `pomelo-BE/src/domain/entities/product.ts`
- `pomelo-BE/src/application/cqrs/contracts/commands/create-product.command.ts`
- `pomelo-BE/src/application/cqrs/contracts/commands/update-product.command.ts`

Cambios:

- crear tipos para `ProductVariant`
- crear tipos para `fabricColor` y `printColor`
- reemplazar `availableColors` por `variants`
- sacar `images` planas del contrato principal del producto

### 2. Persistir variantes en MySQL

Objetivo:

- guardar cada combinacion de producto con sus imagenes

Archivos a tocar:

- `pomelo-BE/docker/mysql/init/001_schema.sql`
- `pomelo-BE/src/infrastructure/commands/create-product.command-impl.ts`
- `pomelo-BE/src/infrastructure/commands/update-product.command-impl.ts`
- `pomelo-BE/src/infrastructure/queries/get-products.query-impl.ts`

Cambios:

- crear tabla `product_variants`
- crear tabla `product_variant_images`
- guardar una fila por combinacion `tela + estampa`
- guardar las imagenes asociadas a cada variante
- devolver las variantes completas al consultar productos

Nota:

- no conviene seguir usando `product_colors` para este caso
- las imagenes ya no pertenecen al producto completo sino a cada variante

### 3. Validar el nuevo payload de productos

Objetivo:

- aceptar desde API el nuevo formato con variantes

Archivos a tocar:

- `pomelo-BE/src/api/routes/products.routes.ts`
- `pomelo-BE/src/api/routes/products.routes.test.ts`
- `pomelo-BE/src/api/docs/openapi.ts`

Cambios:

- validar `variants`
- validar `fabricColor.name`
- validar `fabricColor.hex`
- validar `printColor.name`
- validar `printColor.hex`
- validar `images[]`
- rechazar combinaciones duplicadas
- actualizar contratos de OpenAPI

### 4. Adaptar tipos y mapeo en frontend

Objetivo:

- preparar la app para trabajar con variantes sin romper cards ni listados

Archivos a tocar:

- `pomelo-FE/lib/catalog-data.ts`

Cambios:

- agregar tipos de variantes para frontend
- mapear respuesta backend a un producto usable en UI
- mantener una variante default para derivar:
  - `thumbnail`
  - `hoverImage`
  - `galleryImages`

Esto permite que las cards sigan funcionando mientras cambiamos la PDP.

### 5. Actualizar detalle de producto

Objetivo:

- mostrar 2 selectores y cambiar la galeria segun la combinacion elegida

Archivos a tocar:

- `pomelo-FE/pages/product/[slug].tsx`
- `pomelo-FE/components/ProductInfo.tsx`
- `pomelo-FE/components/ProductGallery.tsx`
- `pomelo-FE/components/ColorSwatches.tsx`

Cambios:

- agregar estado para `selectedFabricColor`
- agregar estado para `selectedPrintColor`
- resolver la variante activa segun la combinacion elegida
- pasar la galeria de la variante activa a `ProductGallery`
- mostrar selector de `Color de tela`
- mostrar selector de `Color de estampa`

Comportamiento esperado:

- al entrar al producto se selecciona una variante valida por defecto
- si el usuario cambia tela o estampa, la galeria cambia
- si una combinacion no existe, no debe poder quedar seleccionada

### 6. Adaptar carrito

Objetivo:

- guardar y mostrar la variante correcta en carrito y WhatsApp

Archivos a tocar:

- `pomelo-FE/context/cart-context.tsx`
- `pomelo-FE/components/CartDrawer.tsx`
- `pomelo-FE/components/ProductInfo.tsx`

Cambios:

- guardar `fabricColor`
- guardar `printColor`
- usar ambos valores para la clave del item
- mostrar ambos valores en el drawer
- incluir ambos valores en el mensaje de WhatsApp

### 7. Redisenar la carga en admin

Objetivo:

- hacer que la carga de variantes sea manual pero intuitiva

Archivo principal:

- `pomelo-FE/pages/admin/index.tsx`

Enfoque UX recomendado:

1. Mantener los datos generales del producto arriba.
2. Reemplazar el bloque actual de `Colores` e `Imagenes` por una seccion `Variantes`.
3. Cada variante debe tener:
   - color de tela
   - color de estampa
   - subida de imagenes
   - preview de imagenes
   - reordenamiento de imagenes
   - eliminar variante
4. Agregar un boton `Nueva variante`.

Formato recomendado de carga:

- cada variante como tarjeta independiente
- titulo visible tipo `Variante 1`, `Variante 2`
- textos claros: `Color de tela`, `Color de estampa`, `Imagenes de esta variante`
- previews inmediatas despues de subir

Objetivo UX:

- que una persona pueda entender la carga sin recordar formatos especiales en textarea
- evitar depender de sintaxis como `Nombre|#hex`

### 8. Mantener compatibilidad visual en cards

Objetivo:

- no romper la grilla de tienda mientras incorporamos variantes

Archivo a revisar:

- `pomelo-FE/components/ProductCard.tsx`

Decision:

- usar la variante default para imagen principal y hover
- si hace falta, mostrar solo colores de tela en la card

### 9. Pruebas finales

Objetivo:

- validar flujo completo de admin a frontend

Checklist funcional:

1. Crear o editar una remera desde admin.
2. Agregar al menos 2 variantes.
3. Subir imagenes distintas para cada variante.
4. Guardar el producto.
5. Abrir la PDP.
6. Cambiar color de tela.
7. Cambiar color de estampa.
8. Confirmar cambio de imagenes.
9. Agregar ambas combinaciones al carrito.
10. Confirmar que no se mezclen entre si.
11. Revisar mensaje de WhatsApp.

Checklist tecnico:

1. Ejecutar tests backend.
2. Ejecutar build o validacion del frontend.
3. Verificar que las rutas `/uploads/...` sigan resolviendo bien.

## Riesgos A Controlar

- Romper cards si desaparecen `thumbnail` y `hoverImage`.
- Mezclar items en carrito si la clave no incluye tela y estampa.
- Permitir combinaciones invalidas en PDP.
- Hacer un admin confuso si la carga queda basada en textareas.

## Criterios De Aceptacion

- El cliente puede elegir tela y estampa por separado.
- La galeria cambia segun la combinacion seleccionada.
- Cada combinacion usa imagenes propias alojadas en el server.
- El carrito guarda correctamente la variante elegida.
- El admin puede cargar variantes de forma manual e intuitiva.

## Orden Recomendado De Ejecucion

1. Backend y schema.
2. Tipos y mapper frontend.
3. PDP y carrito.
4. Admin de variantes.
5. Tests y validacion completa.
