# Publicacion Pendiente

## Estado Actual

- El admin ya quedo separado en SPA por secciones: `Colecciones` y `Remeras`.
- Ya existe upload real de imagenes desde el admin.
- Las imagenes se guardan en `pomelo-FE/public/uploads/...`.
- Las imagenes quedan publicas en rutas `/uploads/...`.
- El deploy por GitHub Actions via SSH ya esta preparado.
- El workflow nuevo esta en `.github/workflows/deploy.yml`.
- El script remoto esta en `scripts/deploy-remote.sh`.
- La guia detallada esta en `docs/deploy-github-actions.md`.

## Lo Mas Importante Que Falta

1. Definir las URLs publicas reales de produccion.
2. Preparar el servidor con Docker, carpeta del proyecto y `.env` real.
3. Configurar los secrets y vars en GitHub.
4. Hacer el primer deploy manual desde GitHub Actions.
5. Validar frontend, admin, login e imagenes subidas.
6. Idealmente agregar proxy reverso con HTTPS antes de abrirlo al publico.

## Paso A Paso Recomendado

### 1. Definir Como Va A Quedar Publico

Elegir una de estas opciones:

- Opcion A, recomendada: subdominios separados.
  - Frontend: `https://shop.tu-dominio.com`
  - API catalogo: `https://api.tu-dominio.com`
  - Auth: `https://auth.tu-dominio.com`
- Opcion B: un solo dominio con proxy y rutas internas.

Nota:

- Hoy el frontend usa `NEXT_PUBLIC_API_BASE_URL` y `NEXT_PUBLIC_AUTH_API_BASE_URL` desde el navegador.
- Eso significa que esas dos URLs tienen que existir publicamente o estar proxyadas correctamente.

### 2. Preparar El Servidor

Pendientes en el servidor:

- Instalar Docker.
- Instalar Docker Compose plugin.
- Tener `curl` disponible para healthchecks.
- Crear carpeta de deploy, por ejemplo `/srv/pomelo`.
- Crear carpeta persistente para uploads: `/srv/pomelo/pomelo-FE/public/uploads`.
- Usar un usuario con permisos para ejecutar Docker.

### 3. Crear El `.env` Real En El Servidor

Archivo: `/srv/pomelo/.env`

Minimo necesario:

```env
JWT_KEY=una-clave-larga-y-segura
MYSQL_ROOT_PASSWORD=CAMBIAR
MYSQL_DATABASE=pomelo
MYSQL_USER=pomelo_user
MYSQL_PASSWORD=CAMBIAR
MSSQL_SA_PASSWORD=CAMBIAR
AUTH_BOOTSTRAP_ADMIN_EMAIL=admin@tu-dominio.com
AUTH_BOOTSTRAP_ADMIN_PASSWORD=CAMBIAR
AUTH_BOOTSTRAP_ADMIN_FIRST_NAME=Admin
AUTH_BOOTSTRAP_ADMIN_LAST_NAME=Pomelo
AUTH_BOOTSTRAP_ADMIN_DNI=12345678
NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com
NEXT_PUBLIC_AUTH_API_BASE_URL=https://auth.tu-dominio.com
```

Importante:

- No usar passwords de ejemplo en produccion.
- `JWT_KEY` debe ser una clave larga y privada.

### 4. Preparar Acceso SSH Para GitHub Actions

Hay que generar una clave exclusiva para deploy.

Pasos:

1. Generar clave `ed25519` local.
2. Agregar la publica al `authorized_keys` del servidor.
3. Obtener `known_hosts` con `ssh-keyscan -H TU_HOST`.

### 5. Cargar Secrets Y Variables En GitHub

Crear environment `production` y cargar:

Secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_PRIVATE_KEY`
- `DEPLOY_KNOWN_HOSTS`

Variables:

- `DEPLOY_PATH` ejemplo `/srv/pomelo`
- `DEPLOY_PORT` ejemplo `22`

### 6. Configurar Proxy Reverso Y HTTPS

Esto todavia falta y es recomendable hacerlo antes de publicar.

Objetivo:

- exponer solo `80/443`
- enrutar al frontend, API y auth
- tener certificados HTTPS

Opciones razonables:

- Caddy, mas simple
- Nginx, mas manual

### 7. Hacer El Primer Deploy

Una vez listo lo anterior:

1. Subir cambios a GitHub.
2. Ejecutar `Deploy` manualmente desde Actions si queres probar controlado.
3. Revisar logs del workflow.
4. Verificar que el servidor ejecute `docker compose up -d --build --remove-orphans` sin errores.

### 8. Verificacion Final

Checklist de prueba:

1. Abrir home del frontend.
2. Abrir `/admin/login`.
3. Iniciar sesion como admin.
4. Crear una coleccion.
5. Subir portada desde el admin.
6. Crear una remera.
7. Subir varias imagenes.
8. Confirmar que las imagenes respondan por `/uploads/...`.
9. Verificar `GET /api/health`.

## Riesgos O Mejoras Pendientes

- Falta definir proxy reverso/SSL.
- Falta revisar si conviene ocultar puertos `4000`, `5174` y `8082` detras del proxy.
- Falta politica de backup para:
  - volumen MySQL
  - volumen SQL Server
  - carpeta `pomelo-FE/public/uploads`
- Falta cambiar todas las credenciales de ejemplo.
- `next lint` todavia no esta configurado de forma no interactiva en el frontend.

## Punto De Reanudacion

Cuando retomemos, conviene seguir en este orden:

1. Definir dominio/subdominios finales.
2. Preparar `.env` de produccion.
3. Configurar GitHub secrets.
4. Montar proxy reverso con HTTPS.
5. Ejecutar primer deploy.

## Archivos Clave

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `scripts/deploy-remote.sh`
- `docs/deploy-github-actions.md`
- `docker-compose.yml`
- `.env.example`
