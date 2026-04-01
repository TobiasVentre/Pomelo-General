#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-$(pwd)}"

cd "$REPO_ROOT"

if [[ ! -f docker-compose.yml ]]; then
  echo "docker-compose.yml no encontrado en $REPO_ROOT" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Falta el archivo .env en el servidor. Copialo manualmente antes del deploy." >&2
  exit 1
fi

mkdir -p pomelo-FE/public/uploads

docker compose -f docker-compose.yml config >/dev/null
docker compose -f docker-compose.yml up -d --build --remove-orphans

if command -v curl >/dev/null 2>&1; then
  for attempt in $(seq 1 24); do
    if curl --fail --silent --show-error http://127.0.0.1:4000/api/health >/dev/null \
      && curl --fail --silent --show-error http://127.0.0.1:8082/swagger/index.html >/dev/null \
      && curl --fail --silent --show-error http://127.0.0.1:5174 >/dev/null; then
      docker compose -f docker-compose.yml ps
      exit 0
    fi

    sleep 5
  done

  echo "Los servicios no quedaron saludables dentro del tiempo esperado." >&2
  docker compose -f docker-compose.yml ps
  exit 1
fi

echo "curl no esta instalado en el servidor. Se omite la verificacion HTTP final."
docker compose -f docker-compose.yml ps
