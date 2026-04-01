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

COMPOSE_ARGS=(-f docker-compose.yml)

EDGE_PROXY_ENABLED="true"

if [[ -f .env ]]; then
  env_proxy_value="$(grep -E '^[[:space:]]*ENABLE_EDGE_PROXY=' .env | tail -n 1 | cut -d '=' -f 2- | tr -d '\r' | xargs || true)"
  if [[ -n "$env_proxy_value" ]]; then
    EDGE_PROXY_ENABLED="${env_proxy_value,,}"
  fi
fi

if [[ -f docker-compose.proxy.yml && "$EDGE_PROXY_ENABLED" != "false" ]]; then
  COMPOSE_ARGS+=(-f docker-compose.proxy.yml)
fi

mkdir -p pomelo-FE/public/uploads

docker compose "${COMPOSE_ARGS[@]}" config >/dev/null
docker compose "${COMPOSE_ARGS[@]}" up -d --build --remove-orphans

if command -v curl >/dev/null 2>&1; then
  for attempt in $(seq 1 24); do
    if curl --fail --silent --show-error http://127.0.0.1:4000/api/health >/dev/null \
      && curl --fail --silent --show-error http://127.0.0.1:8082/swagger/index.html >/dev/null \
      && curl --fail --silent --show-error http://127.0.0.1:5174 >/dev/null; then
      docker compose "${COMPOSE_ARGS[@]}" ps
      exit 0
    fi

    sleep 5
  done

  echo "Los servicios no quedaron saludables dentro del tiempo esperado." >&2
  docker compose "${COMPOSE_ARGS[@]}" ps
  exit 1
fi

echo "curl no esta instalado en el servidor. Se omite la verificacion HTTP final."
docker compose "${COMPOSE_ARGS[@]}" ps
