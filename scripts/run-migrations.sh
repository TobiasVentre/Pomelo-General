#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-$(pwd)}"
ENV_FILE="$REPO_ROOT/.env"
MIGRATIONS_DIR="$REPO_ROOT/pomelo-BE/migrations"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "run-migrations: missing .env at $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

CONTAINER=$(docker ps -qf "name=pomelo_mysql" | head -1)
if [[ -z "$CONTAINER" ]]; then
  echo "run-migrations: pomelo_mysql container is not running" >&2
  exit 1
fi

DB_USER="${MYSQL_USER:-pomelo_user}"
DB_PASS="${MYSQL_PASSWORD:-pomelo_pass}"
DB_NAME="${MYSQL_DATABASE:-pomelo}"

mysql_exec() {
  docker exec -i "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" "$@"
}

mysql_exec -e "CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT NOW()
);" 2>/dev/null

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "run-migrations: no migrations directory found, skipping."
  exit 0
fi

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
  echo "run-migrations: no migration files found."
  exit 0
fi

for file in $(printf '%s\n' "${files[@]}" | sort); do
  version=$(basename "$file")
  applied=$(mysql_exec -sN -e "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';" 2>/dev/null)
  if [[ "${applied:-0}" -gt 0 ]]; then
    echo "  skip  $version"
    continue
  fi
  echo "  apply $version"
  mysql_exec 2>/dev/null < "$file"
  mysql_exec -e "INSERT INTO schema_migrations (version) VALUES ('$version');" 2>/dev/null
  echo "  done  $version"
done

echo "run-migrations: all migrations applied."
