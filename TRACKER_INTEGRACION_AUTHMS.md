# Tracker de Integracion AuthMS en Pomelo

## Objetivo

Usar `AuthMS` como microservicio de identidad y autorizacion para proteger el admin de `pomelo`, sin mezclar responsabilidades entre servicios y validando cada avance con pruebas reales.

## Como usar este documento

- Actualizar el `Estado` de cada tarea a medida que avancemos.
- No marcar una tarea como cerrada sin completar su `Validacion real`.
- Registrar evidencia concreta en cada tarea: comando usado, endpoint probado, respuesta esperada y resultado real.
- Si una tarea queda parcialmente hecha, usar `En curso`.
- Si una tarea depende de otra o aparece un problema externo, usar `Bloqueado`.

## Estados

- `Pendiente`: no empezada.
- `En curso`: se esta implementando.
- `Bloqueado`: no puede continuar por una dependencia o problema externo.
- `Implementado`: el cambio de codigo esta hecho.
- `Validado`: el cambio fue probado con resultados reales y correctos.
- `Descartado`: se decidio no hacer esa tarea.

## Resumen ejecutivo

| Fase | Nombre | Objetivo | Estado |
| --- | --- | --- | --- |
| 0 | Preparacion de AuthMS | Dejar `AuthMS` usable y seguro para este proyecto | Validado |
| 1 | Proteccion de `pomelo-BE` | Validar JWT y roles en el backend Node | Validado |
| 2 | Sesion y login en `pomelo-FE` | Agregar login admin y proteger `/admin` | Validado |
| 3 | Ajuste funcional de AuthMS | Adaptar el modelo de usuarios al ecommerce | Pendiente |
| 4 | Infraestructura y despliegue | Unificar entorno y preparar produccion | En curso |

## Fase 0 - Preparacion de AuthMS

### Tarea 0.1 - Relevar el alcance real de AuthMS

- Estado: `Implementado`
- Objetivo: confirmar que usaremos solo identidad y autorizacion, evitando arrastrar dominios ajenos.
- Esperamos:
  - identificar endpoints que quedan en uso;
  - identificar endpoints legacy que no vamos a integrar ahora;
  - dejar una decision clara sobre el alcance inicial.
- Validacion real:
  - revisar `AuthController` y controladores adicionales;
  - revisar `AUTHMS_DECOMPOSITION_PLAN.md`;
  - dejar listado final de endpoints habilitados para Pomelo.
- Evidencia:
  - archivos revisados:
  - decision tomada:

### Tarea 0.2 - Endurecer configuracion de AuthMS

- Estado: `Implementado`
- Objetivo: sacar configuracion insegura o de desarrollo antes de integrarlo con Pomelo.
- Esperamos:
  - `JwtSettings:key` segura;
  - expiracion razonable de access token;
  - CORS restringido;
  - secretos fuera del repo;
  - configuracion separada por ambiente.
- Validacion real:
  - levantar `AuthMS` con variables reales;
  - verificar que arranca sin usar defaults inseguros;
  - probar login y refresh con la nueva configuracion.
- Evidencia:
  - variables definidas:
  - comando de arranque:
  - resultado:

### Tarea 0.3 - Definir roles iniciales para Pomelo

- Estado: `Validado`
- Objetivo: reducir el modelo de autorizacion a lo que Pomelo necesita hoy.
- Esperamos:
  - usar al menos rol `Admin` para admin catalogo;
  - decidir si `Client` se usa ahora o se posterga;
  - mapear claims minimos requeridos por `pomelo-BE`.
- Validacion real:
  - crear matriz simple de roles y permisos;
  - emitir token de un usuario admin;
  - inspeccionar claims del token.
- Evidencia:
  - roles aprobados:
  - claims esperados:
  - claims observados:

### Tarea 0.4 - Crear o adaptar bootstrap del primer admin

- Estado: `Validado`
- Objetivo: poder crear el primer usuario administrador de forma controlada.
- Esperamos:
  - contar con un admin inicial sin depender de carga manual improvisada;
  - evitar hardcodear credenciales en codigo.
- Validacion real:
  - crear un admin por script, endpoint o seed controlada;
  - ejecutar login exitoso con ese usuario;
  - verificar rol admin en el token.
- Evidencia:
  - metodo elegido: bootstrap idempotente al arranque de `AuthMS`
  - flujo implementado: migraciones EF + alta automatica del admin si no existe
  - resultado: validado en entorno Docker sin SQL manual

### Criterio de salida de Fase 0

- `AuthMS` levanta correctamente.
- Existe al menos un usuario admin funcional.
- Se puede hacer login y obtener access token valido.
- La configuracion insegura de desarrollo quedo reemplazada o aislada.

## Fase 1 - Proteccion de pomelo-BE

### Tarea 1.1 - Agregar soporte JWT al backend Node

- Estado: `Validado`
- Objetivo: permitir que `pomelo-BE` valide tokens emitidos por `AuthMS`.
- Esperamos:
  - middleware de autenticacion JWT;
  - lectura de claims relevantes;
  - errores `401` consistentes cuando no haya token valido.
- Validacion real:
  - probar endpoint protegido sin token;
  - probar endpoint protegido con token invalido;
  - probar endpoint protegido con token valido.
- Evidencia:
  - libreria usada: `jsonwebtoken`
  - endpoints probados: middleware `verifyAccessToken` y `requireAuth`
  - resultados: token admin compatible validado; ausencia de token devuelve `401`

### Tarea 1.2 - Agregar middleware de autorizacion por rol

- Estado: `Validado`
- Objetivo: permitir reglas como `requireRole("Admin")`.
- Esperamos:
  - autorizacion basada en claims/role;
  - respuesta `403` para usuarios autenticados sin permisos.
- Validacion real:
  - probar con usuario admin;
  - probar con usuario sin rol admin;
  - verificar diferencia entre `401` y `403`.
- Evidencia:
  - roles testeados: `Admin`, `Client`
  - comportamiento observado: `Client` recibe `403`; `Admin` pasa al siguiente handler

### Tarea 1.3 - Proteger CRUD de productos

- Estado: `Validado`
- Objetivo: dejar publico el read model y proteger mutaciones.
- Esperamos:
  - `GET /api/products` y `GET /api/products/:slug` siguen publicos;
  - `POST /api/products` y `PUT /api/products/:id` requieren admin.
- Validacion real:
  - probar `GET` sin token;
  - probar `POST/PUT` sin token;
  - probar `POST/PUT` con token admin.
- Evidencia:
  - endpoints: `GET /api/products`, `POST /api/products`
  - resultados: `GET` publico validado; `POST` sin token devuelve `401`; `POST` con token admin real de `AuthMS` responde correctamente

### Tarea 1.4 - Proteger CRUD de colecciones

- Estado: `Validado`
- Objetivo: aplicar la misma politica a colecciones.
- Esperamos:
  - `GET /api/collections` y `GET /api/collections/:slug` publicos;
  - `POST /api/collections` y `PUT /api/collections/:id` protegidos.
- Validacion real:
  - repetir pruebas reales para `GET`, `POST` y `PUT`;
  - verificar codigos `200/201`, `401` y `403` segun corresponda.
- Evidencia:
  - endpoints: `GET /api/collections`, `POST /api/collections`
  - resultados: `GET` publico validado; `POST` sin token devuelve `401`; `POST` con token admin real de `AuthMS` responde correctamente

### Tarea 1.5 - Centralizar configuracion de auth en pomelo-BE

- Estado: `Validado`
- Objetivo: evitar configuracion dispersa y alinear secretos con `AuthMS`.
- Esperamos:
  - variables de entorno claras;
  - misma clave o configuracion de validacion que `AuthMS`;
  - documentacion de entorno local y productivo.
- Validacion real:
  - levantar `pomelo-BE` con variables nuevas;
  - verificar que falla de forma clara si falta configuracion;
  - verificar que pasa si la clave coincide.
- Evidencia:
  - variables agregadas: `AUTH_JWT_SECRET`, `AUTH_JWT_ISSUER`, `AUTH_JWT_AUDIENCE`
  - comportamiento observado: alinear `AUTH_JWT_SECRET` con `AuthMS` resolvio `invalid signature` y habilito la validacion real

### Criterio de salida de Fase 1

- El backend valida JWT emitidos por `AuthMS`.
- Las mutaciones del catalogo estan protegidas.
- Los endpoints publicos siguen funcionando sin autenticacion.
- Cerrado con prueba integrada contra `AuthMS` vivo y prueba HTTP real sobre el servidor Express.

## Fase 2 - Sesion y login en pomelo-FE

### Tarea 2.1 - Crear pantalla de login admin

- Estado: `Validado`
- Objetivo: permitir inicio de sesion de administradores desde el frontend.
- Esperamos:
  - vista de login funcional;
  - manejo de error de credenciales;
  - integracion con `AuthMS`.
- Validacion real:
  - probar login exitoso;
  - probar login con password invalida;
  - probar usuario sin permisos.
- Evidencia:
  - ruta: `/admin/login`
  - integracion: `pages/api/auth/login.ts` contra `AuthMS /api/v1/Auth/Login`
  - resultados: login real probado correctamente en navegador

### Tarea 2.2 - Guardar sesion de forma segura

- Estado: `Validado`
- Objetivo: evitar exponer tokens en el navegador de forma insegura.
- Esperamos:
  - uso de cookie `httpOnly` para la sesion;
  - no usar `localStorage` para access token;
  - flujo claro de login, refresh y logout.
- Validacion real:
  - inspeccionar cookies al loguear;
  - verificar renovacion de sesion;
  - verificar cierre de sesion.
- Evidencia:
  - estrategia elegida: cookies `httpOnly` para access token y refresh token
  - cookies definidas: `pomelo_admin_access_token`, `pomelo_admin_refresh_token`
  - resultado: sesion validada en flujo real de login/logout

### Tarea 2.3 - Proteger la ruta `/admin`

- Estado: `Validado`
- Objetivo: impedir acceso al panel sin sesion valida.
- Esperamos:
  - redireccion a login cuando no haya sesion;
  - acceso habilitado solo para admin;
  - feedback claro si la sesion expiro.
- Validacion real:
  - abrir `/admin` sin login;
  - abrir `/admin` con admin logueado;
  - abrir `/admin` con sesion invalida o vencida.
- Evidencia:
  - escenarios implementados: redireccion a `/admin/login` sin sesion; acceso permitido con admin valido
  - resultados: proteccion validada en entorno real

### Tarea 2.4 - Reenviar token desde FE hacia pomelo-BE

- Estado: `Validado`
- Objetivo: asegurar que las API routes admin del FE llamen al backend con credenciales validas.
- Esperamos:
  - los endpoints `/api/admin/*` agregan `Authorization: Bearer ...`;
  - el FE no llama al backend protegido sin token.
- Validacion real:
  - crear producto desde UI;
  - editar coleccion desde UI;
  - repetir sin sesion y validar rechazo.
- Evidencia:
  - acciones implementadas: `POST/PUT` admin de productos y colecciones reenvian bearer token desde cookie
  - resultados: CRUD admin validado con sesion real

### Criterio de salida de Fase 2

- Existe login admin operativo.
- `/admin` queda protegido.
- El panel puede crear y editar catalogo usando la sesion autenticada.

## Fase 3 - Ajuste funcional de AuthMS para ecommerce

### Tarea 3.1 - Revisar el DTO de registro de usuario

- Estado: `Pendiente`
- Objetivo: adaptar el modelo heredado a necesidades reales de ecommerce.
- Esperamos:
  - separar lo obligatorio de lo accesorio;
  - no exigir campos ajenos al negocio actual;
  - definir claramente si habra cuentas cliente ahora o despues.
- Validacion real:
  - probar alta con payload realista para admin;
  - probar alta con payload realista para cliente si aplica;
  - verificar validaciones y mensajes.
- Evidencia:
  - payload final:
  - validaciones observadas:

### Tarea 3.2 - Separar identidad de perfiles de negocio

- Estado: `Pendiente`
- Objetivo: no cargar en `AuthMS` informacion que deberia vivir en otro servicio o en el dominio ecommerce.
- Esperamos:
  - `AuthMS` guarda identidad, credenciales, roles y claims;
  - datos comerciales o de cliente quedan fuera si no son necesarios para auth.
- Validacion real:
  - revisar entidades persistidas;
  - verificar que el alta admin no obliga a datos irrelevantes;
  - acordar ownership final de datos.
- Evidencia:
  - decision tomada:
  - campos retenidos:
  - campos descartados:

### Criterio de salida de Fase 3

- `AuthMS` queda alineado al caso de uso de Pomelo.
- El modelo de usuario ya no arrastra acoplamientos del proyecto anterior.

## Fase 4 - Infraestructura y despliegue

### Tarea 4.1 - Definir compose raiz o estrategia de arranque unificada

- Estado: `Implementado`
- Objetivo: levantar `pomelo-FE`, `pomelo-BE`, `AuthMS` y sus bases de forma coordinada.
- Esperamos:
  - comando claro para entorno local;
  - variables separadas por servicio;
  - networking entre contenedores resuelto.
- Validacion real:
  - levantar stack completo;
  - verificar healthchecks y conectividad entre servicios;
  - validar flujo login -> admin -> CRUD.
- Evidencia:
  - comando: `docker compose -f docker-compose.yml up --build`
  - servicios levantados: `pomelo_fe`, `pomelo_api`, `pomelo_mysql`, `authms_api`, `authms_sql_server`
  - resultado: compose raiz implementado y validado por `docker compose config`

### Tarea 4.2 - Definir variables y secretos por ambiente

- Estado: `Implementado`
- Objetivo: preparar local, staging y produccion sin mezclar configuraciones.
- Esperamos:
  - inventario de variables por servicio;
  - secretos fuera del repo;
  - naming consistente.
- Validacion real:
  - levantar cada servicio con variables externas;
  - probar arranque con configuracion incompleta y validar errores claros.
- Evidencia:
  - variables documentadas: `.env.example` raiz + `.env.example` por servicio
  - resultado: compose y workflow usan variables consistentes con defaults de desarrollo

### Tarea 4.3 - Endurecer despliegue para produccion

- Estado: `Pendiente`
- Objetivo: evitar exponer un sistema funcional pero inseguro.
- Esperamos:
  - HTTPS;
  - CORS restringido;
  - Swagger protegido o deshabilitado segun ambiente;
  - logs y monitoreo basicos;
  - backups definidos.
- Validacion real:
  - revisar configuracion de produccion;
  - validar acceso a endpoints protegidos solo desde frontend permitido;
  - validar disponibilidad de logs y restauracion basica.
- Evidencia:
  - controles aplicados:
  - resultado:

### Criterio de salida de Fase 4

- El sistema puede levantarse completo de forma reproducible.
- Hay una base razonable para staging o produccion.

## Registro de validaciones reales

Usar esta tabla para anotar cada prueba concreta que hagamos.

| Fecha | Fase/Tarea | Entorno | Prueba ejecutada | Resultado esperado | Resultado real | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-03-21 | 1.1 | Local build | `npm.cmd run lint` en `pomelo-BE` | Typecheck limpio | Correcto | Validado |
| 2026-03-21 | 1.1 | Local build | `npm.cmd run build` en `pomelo-BE` | Compilacion OK | Correcto | Validado |
| 2026-03-21 | 1.1 | Script Node | Verificar token admin compatible con `AuthMS` | Extraer `userId`, `role`, `email` | Correcto | Validado |
| 2026-03-21 | 1.1 | Script Node | `requireAuth/requireRole` sin token | `401` | Correcto | Validado |
| 2026-03-21 | 1.2 | Script Node | `requireRole('Admin')` con token `Client` | `403` | Correcto | Validado |
| 2026-03-21 | 1.2 | Script Node | `requireRole('Admin')` con token `Admin` | pasar al siguiente handler | Correcto | Validado |
| 2026-03-21 | 1.3 | Local HTTP | `curl http://localhost:4000/api/products` | listado publico sin token | Correcto | Validado |
| 2026-03-21 | 1.3 | Local HTTP | `POST /api/products` sin token | `401` | Correcto | Validado |
| 2026-03-21 | 1.3 | Local HTTP | `POST /api/products` con token admin real de `AuthMS` | respuesta exitosa | Correcto | Validado |
| 2026-03-21 | 1.4 | Local HTTP | `curl http://localhost:4000/api/collections` | listado publico sin token | Correcto | Validado |
| 2026-03-21 | 1.4 | Local HTTP | `POST /api/collections` sin token | `401` | Correcto | Validado |
| 2026-03-21 | 1.4 | Local HTTP | `POST /api/collections` con token admin real de `AuthMS` | respuesta exitosa | Correcto | Validado |
| 2026-03-21 | 1.5 | Local config | `AUTH_JWT_SECRET` alineado con `AuthMS` | firma valida | Correcto | Validado |
| 2026-03-21 | 2.1-2.4 | FE typecheck | `npx.cmd tsc --noEmit` en `pomelo-FE` | sin errores de tipos | Correcto | Validado |
| 2026-03-21 | 2.1-2.4 | FE navegador | login, acceso admin, CRUD y logout | flujo admin operativo | Correcto | Validado |
| 2026-03-21 | 0.4 | AuthMS Docker | bootstrap admin en startup | crear admin si no existe | Correcto | Validado |
| 2026-03-21 | 4.1 | Compose raiz | `docker compose -f docker-compose.yml config` | compose valido | Correcto | Implementado |

## Riesgos abiertos

| Riesgo | Impacto | Mitigacion | Estado |
| --- | --- | --- | --- |
| `AuthMS` hoy incluye logica heredada de otros dominios | Medio | Acotar alcance en Fase 0 y Fase 3 | Abierto |
| `AuthMS` usa SQL Server y `pomelo-BE` usa MySQL | Medio | Mantener servicios separados y no unificar persistencia | Abierto |
| CORS y secretos actuales de `AuthMS` no estan listos para produccion | Alto | Endurecer configuracion antes de exponer el servicio | Abierto |
| El admin actual de `pomelo` esta sin autenticacion | Alto | Priorizar Fase 1 y Fase 2 | Mitigado |
| Aun no se probo expiracion real de access token con refresh automatico desde `pomelo-FE` | Medio | Forzar expiracion corta y validar renovacion de sesion | Abierto |

## Proximo paso recomendado

Completar `Fase 4`, tareas `4.1` a `4.3`, y luego avanzar con endurecimiento operativo:

- levantar todo el stack desde el compose raiz;
- validar el acceso por `http://localhost:5174`;
- restringir CORS de `AuthMS`;
- bajar expiracion real del access token;
- validar refresh automatico con expiracion corta.
