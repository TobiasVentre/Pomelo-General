# Deploy Con GitHub Actions

Este repo ya tiene CI en `.github/workflows/ci.yml`.

El deploy automatico queda en `.github/workflows/deploy.yml` y funciona asi:

1. En cada push a `main`, espera a que `CI` termine bien.
2. Si `CI` da OK, GitHub se conecta por SSH al servidor.
3. Sincroniza el repo con `rsync`.
4. Ejecuta `docker compose up -d --build --remove-orphans` en el servidor.

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
JWT_KEY=una-clave-larga-y-segura
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
NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com
NEXT_PUBLIC_AUTH_API_BASE_URL=https://auth.tu-dominio.com
```

Si no tenes subdominios separados, esas dos URLs tienen que ser las rutas publicas reales que va a ver el navegador del usuario. No sirven valores `localhost` en produccion.

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
