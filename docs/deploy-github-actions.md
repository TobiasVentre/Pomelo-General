# Deploy Con GitHub Actions

Este repo ya tiene CI en `.github/workflows/ci.yml`.

El deploy automatico queda en `.github/workflows/deploy.yml` y funciona asi:

1. En cada push a `main`, espera a que `CI` termine bien.
2. Si `CI` da OK, GitHub se conecta por SSH al servidor.
3. Sincroniza el repo con `rsync`.
4. Ejecuta el deploy remoto con `docker compose` usando el stack principal y el proxy reverso.

Tambien se puede disparar manualmente desde GitHub Actions con `workflow_dispatch` y elegir un `ref` para redeploy o rollback.

## Variables y secretos en GitHub

Crear un environment `production` y cargar:

### Secrets

- `DEPLOY_HOST`: host o IP del servidor.
- `DEPLOY_USER`: usuario SSH para deploy.
- `DEPLOY_SSH_PRIVATE_KEY`: clave privada SSH que GitHub usara para entrar al servidor.
- `DEPLOY_KNOWN_HOSTS`: salida de `ssh-keyscan -H TU_HOST`.

### Variables

- `DEPLOY_PATH`: carpeta del proyecto en el servidor. Ejemplo: `/srv/pomelo`.
- `DEPLOY_PORT`: puerto SSH. Si no se define, usa `22`.

## Preparacion Del Servidor

Prerequisitos:

- Docker
- Docker Compose plugin (`docker compose`)
- `curl` recomendado para healthchecks
- Un usuario con permisos para ejecutar Docker

Ejemplo inicial:

```bash
sudo mkdir -p /srv/pomelo
sudo chown -R $USER:$USER /srv/pomelo
mkdir -p /srv/pomelo/pomelo-FE/public/uploads
```

Crear `/srv/pomelo/.env` con tus valores reales. Como minimo:

```env
SERVICE_BIND_IP=127.0.0.1
ENABLE_EDGE_PROXY=true
AUTH_COOKIE_SECURE=true
JWT_KEY=una-clave-larga-y-segura
AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES=18000
AUTH_REFRESH_TOKEN_LENGTH=64
AUTH_REFRESH_TOKEN_LIFETIME_MINUTES=240
AUTH_REFRESH_TOKEN_IDLE_TIMEOUT_MINUTES=30
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=pomelo
MYSQL_USER=pomelo_user
MYSQL_PASSWORD=...
MSSQL_SA_PASSWORD=...
AUTH_BOOTSTRAP_ADMIN_EMAIL=admin@tu-dominio.com
AUTH_BOOTSTRAP_ADMIN_PASSWORD=...
AUTH_BOOTSTRAP_ADMIN_FIRST_NAME=Admin
AUTH_BOOTSTRAP_ADMIN_LAST_NAME=Pomelo
AUTH_BOOTSTRAP_ADMIN_DNI=12345678
POMELO_FRONTEND_SITE=shop.tu-dominio.com
POMELO_API_SITE=api.tu-dominio.com
POMELO_AUTH_SITE=auth.tu-dominio.com
NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com
NEXT_PUBLIC_AUTH_API_BASE_URL=https://auth.tu-dominio.com
```

`SERVICE_BIND_IP=127.0.0.1` deja MySQL, SQL Server, API, Auth y frontend accesibles solo desde el propio servidor. El acceso publico queda concentrado en Caddy por `80/443`.

`ENABLE_EDGE_PROXY=true` hace que `scripts/deploy-remote.sh` levante tambien `docker-compose.proxy.yml`. Ese es el modo recomendado cuando ya tenes dominio.

`AUTH_COOKIE_SECURE=true` es el valor correcto cuando publicas con HTTPS. Si haces una prueba temporal solo con IP y HTTP, cambia esa variable a `false` o el login admin no va a poder guardar cookies de sesion.

Las variables `AUTH_ACCESS_TOKEN_EXPIRATION_MINUTES`, `AUTH_REFRESH_TOKEN_LENGTH`, `AUTH_REFRESH_TOKEN_LIFETIME_MINUTES` y `AUTH_REFRESH_TOKEN_IDLE_TIMEOUT_MINUTES` completan la configuracion que AuthMS necesita en `Production` para emitir access token y refresh token.

`POMELO_FRONTEND_SITE`, `POMELO_API_SITE` y `POMELO_AUTH_SITE` son las direcciones que Caddy va a publicar. En produccion conviene usar hostnames reales sin `http://` para que Caddy emita HTTPS automaticamente.

Si no tenes subdominios separados, las dos variables `NEXT_PUBLIC_*` tienen que apuntar a las rutas publicas reales que va a ver el navegador del usuario. No sirven valores `localhost` en produccion.

## Proxy Reverso Y HTTPS

El repo ahora incluye:

- `docker-compose.proxy.yml`
- `infra/caddy/Caddyfile`

Ese stack agrega Caddy delante del frontend, la API y AuthMS.

En produccion:

- expone solo `80` y `443`
- reenvia trafico a `pomelo_fe`, `pomelo_api` y `authms_api`
- gestiona certificados HTTPS automaticamente cuando los dominios ya apuntan al servidor

Antes del primer deploy publico:

1. Crear registros DNS para `shop`, `api` y `auth` o los hostnames que vayas a usar.
2. Abrir `80/443` en firewall o security group.
3. Confirmar que `POMELO_*_SITE` coincida exactamente con esos hostnames.

## Deploy Temporal Solo Con IP

Si todavia no tenes dominio, podes hacer una publicacion temporal usando la IP publica del servidor.

Limitaciones:

- no vas a tener HTTPS valido
- Caddy no puede emitir certificados publicos normales para una IP cruda
- el modo recomendado sigue siendo usar dominio cuando quieras dejarlo serio o estable

Valores sugeridos para `/srv/pomelo/.env` en ese caso:

```env
SERVICE_BIND_IP=127.0.0.1
ENABLE_EDGE_PROXY=true
AUTH_COOKIE_SECURE=false
POMELO_FRONTEND_SITE=:80
NEXT_PUBLIC_API_BASE_URL=http://TU_IP_PUBLICA/backend
NEXT_PUBLIC_AUTH_API_BASE_URL=http://TU_IP_PUBLICA/authms
```

Con ese modo temporal:

- frontend: `http://TU_IP_PUBLICA`
- API catalogo: `http://TU_IP_PUBLICA/backend/api/...`
- AuthMS: `http://TU_IP_PUBLICA/authms/...`

Y en firewall alcanza con permitir `80/tcp` y `22/tcp`.

Notas:

- Caddy publica el frontend en la raiz `/`
- Caddy reenvia `/backend/*` al backend Node
- Caddy reenvia `/authms/*` a AuthMS
- el frontend ya puede consumir esas rutas publicas sin exponer directamente `4000`, `5174` y `8082`

## Generar Clave SSH Para GitHub Actions

En tu maquina local:

```bash
ssh-keygen -t ed25519 -C "github-actions-pomelo" -f ./github-actions-pomelo
```

Despues:

1. Agrega `github-actions-pomelo.pub` a `~/.ssh/authorized_keys` del servidor.
2. Copia el contenido de `github-actions-pomelo` en el secret `DEPLOY_SSH_PRIVATE_KEY`.
3. Corre `ssh-keyscan -H TU_HOST` y guarda la salida en `DEPLOY_KNOWN_HOSTS`.

## Que Preserva El Deploy

El workflow sincroniza el repo con `rsync --delete`, pero excluye:

- `.env`
- `.env.*`
- `pomelo-FE/public/uploads/`

Eso evita borrar:

- configuracion sensible del servidor
- imagenes subidas desde el admin

## Deploy Manual En El Servidor

Si queres correr el deploy sin GitHub Actions:

```bash
cd /srv/pomelo
bash scripts/deploy-remote.sh
```

El script detecta automaticamente `docker-compose.proxy.yml`, valida la configuracion y levanta todo el stack necesario.

Si en `.env` definis `ENABLE_EDGE_PROXY=false`, el deploy levanta solo `docker-compose.yml` y sirve para una prueba temporal directa por IP y puertos, pero no es el modo mas seguro.
